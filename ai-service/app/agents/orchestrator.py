"""LangGraph Orchestrator for the Multi-Agent HR Pipeline."""

import logging
from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, StateGraph

from app.agents.matcher_agent.agent import matching_agent
from app.core.schemas import CVExtractionResponse, MatchingOutput, MatchRequest

logger = logging.getLogger(__name__)


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

    # Flags
    needs_human_review: bool


# --- Nodes ---


def extract_node(state: AgentState) -> dict:
    """Agent 1: Extract CV data."""
    logger.info(f"--- EXTRACT NODE: {state['application_id']} ---")

    # We lazily import process_cv to avoid circular imports if any

    # process_cv is async
    try:
        # Since we might be running inside an async context or event loop,
        # normally LangGraph supports async nodes. Let's make this node async.
        pass
    except Exception as e:
        logger.error(f"Error in extract node: {e}")

    return {}


async def async_extract_node(state: AgentState) -> dict:
    """Agent 1: Extract CV data (Async)."""
    logger.info(f"--- EXTRACT NODE: {state['application_id']} ---")
    from app.agents.extractor_agent.agent import process_cv

    cv_data = await process_cv(state["file_content"], state["filename"])
    return {"cv_data": cv_data}


def match_node(state: AgentState) -> dict:
    """Agent 2: Match CV against JD."""
    logger.info(f"--- MATCH NODE: {state['application_id']} ---")

    request = MatchRequest(
        application_id=state["application_id"],
        cv_data=state["cv_data"],
        job_data=state["job_data"],
        hr_preferences=state["hr_preferences"],
    )

    result = matching_agent.evaluate(request)

    needs_review = result.is_high_potential or result.overall_score >= 50.0

    return {"match_result": result, "needs_human_review": needs_review}


def career_path_node(state: AgentState) -> dict:
    """Agent 3: Career Path Planner (Placeholder)."""
    logger.info(f"--- CAREER PATH NODE: {state['application_id']} ---")
    # To be implemented by another agent.
    return {}


# --- Conditional Edges ---


def check_score(state: AgentState) -> str:
    """Decide next step based on matching score."""
    if state["needs_human_review"]:
        logger.info("Routing: Pause for Human Review.")
        return "human_review"
    else:
        logger.info("Routing: Auto-reject -> Career Path Planner.")
        return "career_path"


# --- Graph Definition ---


def build_graph():
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
            "human_review": END,  # Pause graph, wait for HR
            "career_path": "career_path",
        },
    )

    workflow.add_edge("career_path", END)

    # Memory saver for state persistence (useful for Human-in-the-loop)
    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)
    return graph


agent_graph = build_graph()
