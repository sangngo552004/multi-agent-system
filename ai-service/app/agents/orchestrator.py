"""LangGraph Orchestrator for the Multi-Agent HR Pipeline."""

import logging
import time
from datetime import datetime, timezone
from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.agents.career_path_agent.snapshot_adapter import (
    build_candidate_snapshot,
    build_job_snapshot,
    build_matching_snapshot,
)
from app.agents.matcher_agent.agent import matching_agent
from app.agents.matcher_agent.kb_loader import get_competency_level_description
from app.core.config import settings
from app.core.schemas import (
    CareerPathOutput,
    CareerPathRequest,
    CVExtractionResponse,
    DecisionOutcome,
    DecisionSnapshot,
    DecisionSource,
    JobConfiguration,
    MatchingOutput,
    MatchRequest,
    PlanningPolicy,
)

logger = logging.getLogger(__name__)

# Global checkpointer objects
_postgres_pool = None
_postgres_checkpointer = None


# Define the State for LangGraph
class AgentState(TypedDict):
    application_id: str
    file_content: bytes
    filename: str
    job_data: dict
    hr_preferences: str

    # Extractor Output
    cv_data: CVExtractionResponse | None

    # Matcher Output
    match_result: MatchingOutput | None

    # Career Path Output
    career_path_result: CareerPathOutput | None

    # Flags
    needs_human_review: bool

    # Telemetry Metrics
    telemetry: dict | None


# --- Helper Adapters ---


def build_career_path_request_from_state(state: AgentState) -> CareerPathRequest | None:
    """Build a CareerPathRequest from Orchestrator AgentState using snapshot adapters."""
    cv_data = state.get("cv_data")
    match_result = state.get("match_result")
    if not cv_data or not match_result:
        logger.warning("Missing cv_data or match_result for career path adapter.")
        return None

    # Candidate Snapshot
    candidate_snapshot = build_candidate_snapshot(cv_data)

    # Matching Snapshot
    matching_snapshot = build_matching_snapshot(match_result)

    # Target Role Snapshot from job_data
    job_data = state.get("job_data", {})
    title = (
        job_data.get("title", "Target Position")
        if isinstance(job_data, dict)
        else "Target Position"
    )

    job_config = None
    if isinstance(job_data, dict) and "required_competencies" in job_data:
        try:
            clean_job_data = dict(job_data)
            clean_job_data.setdefault("job_id", "default_job")
            clean_job_data.setdefault("job_family", "Engineering")
            clean_job_data.setdefault("career_level", "Mid")
            job_config = JobConfiguration(**clean_job_data)
        except Exception as e:
            logger.warning("Could not parse JobConfiguration from job_data: %s", e)

    if not job_config:
        job_config = JobConfiguration(
            job_id=job_data.get("job_id", "default_job")
            if isinstance(job_data, dict)
            else "default_job",
            job_family=job_data.get("job_family", "Engineering")
            if isinstance(job_data, dict)
            else "Engineering",
            career_level=job_data.get("career_level", "Mid")
            if isinstance(job_data, dict)
            else "Mid",
            required_competencies=[],
        )

    level_descs: dict[str, str] = {}
    for comp in job_config.required_competencies:
        desc = get_competency_level_description(comp.competency_id, comp.required_level)
        if desc:
            level_descs[comp.competency_id] = desc

    target_role_snapshot = build_job_snapshot(
        job=job_config,
        level_descriptions=level_descs,
        title=title,
    )

    # Decision Snapshot based on match result
    outcome = (
        DecisionOutcome.REJECTED
        if match_result.status == "REJECTED"
        else DecisionOutcome.PENDING_REVIEW
    )

    reason_code = (
        "REJECTED" if outcome == DecisionOutcome.REJECTED else "DEVELOPMENT_REQUIRED"
    )

    decision = DecisionSnapshot(
        decision_id=f"dec_{state['application_id']}",
        outcome=outcome,
        is_final=True,
        source=DecisionSource.AUTO_POLICY,
        reason_codes=[reason_code],
        related_competency_ids=[],
        policy_version="policy-1.0",
        decided_at=datetime.now(timezone.utc),
    )

    policy = PlanningPolicy(
        version="policy-1.0",
        applicable_reason_codes=["REJECTED", "DEVELOPMENT_REQUIRED"],
    )

    return CareerPathRequest(
        application_id=state["application_id"],
        decision=decision,
        candidate=candidate_snapshot,
        job=target_role_snapshot,
        matching=matching_snapshot,
        policy=policy,
    )


# --- Nodes ---


async def async_extract_node(state: AgentState) -> dict:
    """Agent 1: Extract CV data (Async)."""
    start_time = time.perf_counter()
    logger.info("--- EXTRACT NODE: %s ---", state["application_id"])
    from app.agents.extractor_agent.agent import process_cv

    cv_data = await process_cv(state["file_content"], state["filename"])
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    telemetry = dict(state.get("telemetry") or {})
    telemetry["extract_ms"] = elapsed_ms
    if settings.ENABLE_METRICS_LOGGING:
        logger.info(
            "[TELEMETRY] App=%s Node=Extractor Duration=%dms Status=%s",
            state["application_id"],
            elapsed_ms,
            cv_data.status.value if cv_data else "NONE",
        )

    # Free memory so checkpointer doesn't save heavy PDF bytes repeatedly
    return {"cv_data": cv_data, "telemetry": telemetry, "file_content": b""}


async def match_node(state: AgentState) -> dict:
    """Agent 2: Match CV against JD (Async)."""
    start_time = time.perf_counter()
    logger.info("--- MATCH NODE: %s ---", state["application_id"])

    request = MatchRequest(
        application_id=state["application_id"],
        cv_data=state["cv_data"],
        job_data=state["job_data"],
        hr_preferences=state["hr_preferences"],
    )

    result = await matching_agent.evaluate_async(request)
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    needs_review = result.is_high_potential or result.overall_score >= 50.0

    telemetry = dict(state.get("telemetry") or {})
    telemetry["match_ms"] = elapsed_ms
    if settings.ENABLE_METRICS_LOGGING:
        logger.info(
            "[TELEMETRY] App=%s Node=Matcher Duration=%dms Score=%.1f Review=%s",
            state["application_id"],
            elapsed_ms,
            result.overall_score,
            needs_review,
        )

    return {
        "match_result": result,
        "needs_human_review": needs_review,
        "telemetry": telemetry,
    }


async def career_path_node(state: AgentState) -> dict:
    """Agent 3: Career Path Planner Node (Async)."""
    start_time = time.perf_counter()
    logger.info("--- CAREER PATH NODE: %s ---", state["application_id"])
    from app.agents.career_path_agent.agent import career_path_agent

    request = build_career_path_request_from_state(state)
    if not request:
        logger.warning(
            "Could not build CareerPathRequest for application: %s",
            state["application_id"],
        )
        return {"career_path_result": None}

    output = await career_path_agent.generate(request)
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    telemetry = dict(state.get("telemetry") or {})
    telemetry["career_path_ms"] = elapsed_ms
    total_ms = (
        telemetry.get("extract_ms", 0) + telemetry.get("match_ms", 0) + elapsed_ms
    )
    telemetry["total_pipeline_ms"] = total_ms

    if settings.ENABLE_METRICS_LOGGING:
        logger.info(
            "[TELEMETRY] App=%s Node=CareerPath Duration=%dms TotalPipeline=%dms Status=%s",
            state["application_id"],
            elapsed_ms,
            total_ms,
            output.status.value if output else "NONE",
        )

    return {"career_path_result": output, "telemetry": telemetry}


# --- Conditional Edges ---


def check_score(state: AgentState) -> str:
    """Decide next step based on matching score."""
    if state.get("needs_human_review"):
        logger.info(
            "Routing: Passed (needs human review) -> Ending flow without Career Path."
        )
        return "end"
    else:
        logger.info("Routing: Failed -> Generating draft career path for upskilling.")
        return "career_path"


# --- Checkpointer Lifecycle Management ---


async def init_checkpointer():
    """Initialize Postgres Checkpointer if enabled in settings."""
    global _postgres_pool, _postgres_checkpointer
    if settings.CHECKPOINTER_TYPE.lower() == "postgres":
        try:
            from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
            from psycopg_pool import AsyncConnectionPool

            logger.info(
                "Initializing AsyncPostgresSaver checkpointer with DATABASE_URL..."
            )
            _postgres_pool = AsyncConnectionPool(
                conninfo=settings.DATABASE_URL,
                max_size=20,
                kwargs={"autocommit": True},
            )
            await _postgres_pool.open()
            _postgres_checkpointer = AsyncPostgresSaver(_postgres_pool)
            await _postgres_checkpointer.setup()
            logger.info("AsyncPostgresSaver tables initialized successfully.")
            return _postgres_checkpointer
        except Exception as e:
            logger.error(
                "Failed to initialize AsyncPostgresSaver: %s. Falling back to MemorySaver.",
                e,
            )
            _postgres_checkpointer = None
            return MemorySaver()
    return MemorySaver()


async def close_checkpointer():
    """Close Postgres connection pool on application shutdown."""
    global _postgres_pool, _postgres_checkpointer
    if _postgres_pool:
        logger.info("Closing AsyncPostgresSaver connection pool...")
        await _postgres_pool.close()
        _postgres_pool = None
        _postgres_checkpointer = None


# --- Graph Definition ---


def build_graph(checkpointer=None):
    """Compile graph with specified or active checkpointer."""
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("extractor", async_extract_node)
    workflow.add_node("matcher", match_node)
    workflow.add_node("career_path", career_path_node)

    # Add Edges
    workflow.set_entry_point("extractor")
    workflow.add_edge("extractor", "matcher")

    # Conditional edge after matcher
    workflow.add_conditional_edges(
        "matcher",
        check_score,
        {
            "career_path": "career_path",
            "end": END,
        },
    )

    workflow.add_edge("career_path", END)

    if checkpointer is None:
        checkpointer = _postgres_checkpointer or MemorySaver()

    return workflow.compile(checkpointer=checkpointer)


# Default graph instance for backwards compatibility / local testing
agent_graph = build_graph()
