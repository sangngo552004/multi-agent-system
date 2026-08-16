"""Tests for LangGraph Orchestrator Multi-Agent Flow."""

from unittest.mock import patch

import pytest

from app.agents.orchestrator import (
    agent_graph,
    build_career_path_request_from_state,
    match_node,
)
from app.core.schemas import (
    CareerPathDiagnostics,
    CareerPathOutput,
    CareerPathProvenance,
    CareerPathStatus,
    CVExtractionResponse,
    DeliveryStatus,
    ExtractionStatus,
    MatchingOutput,
    PersonalInfo,
)


@pytest.mark.asyncio
async def test_build_career_path_request_adapter():
    cv_data = CVExtractionResponse(
        status=ExtractionStatus.SUCCESS,
        personal_info=PersonalInfo(name="Test Candidate", email="test@example.com"),
        skills=["Python", "FastAPI", "Docker"],
    )
    match_result = MatchingOutput(
        status="EVALUATED",
        overall_score=75.0,
        hard_skill_score=80.0,
    )
    state = {
        "application_id": "app_123",
        "file_content": b"dummy",
        "filename": "test.pdf",
        "job_data": {
            "job_id": "job_dev",
            "title": "Senior Python Developer",
            "required_competencies": [
                {
                    "competency_id": "comp_python",
                    "name": "Python",
                    "category": "HARD_SKILL",
                    "weight": 1.0,
                    "required_level": 3,
                }
            ],
        },
        "hr_preferences": "",
        "cv_data": cv_data,
        "match_result": match_result,
        "career_path_result": None,
        "needs_human_review": False,
    }

    req = build_career_path_request_from_state(state)
    assert req is not None
    assert req.application_id == "app_123"
    assert req.candidate.skills == ["Python", "FastAPI", "Docker"]
    assert req.job.title == "Senior Python Developer"
    assert req.decision.decision_id == "dec_app_123"


@pytest.mark.asyncio
async def test_hr_rejection_forces_final_candidate_deliverable_career_path():
    cv_data = CVExtractionResponse(
        status=ExtractionStatus.SUCCESS,
        personal_info=PersonalInfo(name="Rejected Candidate"),
        skills=["Java"],
    )
    state = {
        "application_id": "app_hr_rejected",
        "job_data": {
            "job_id": "job_java",
            "title": "Java Developer",
            "job_family": "Engineering",
            "career_level": "Mid",
            "required_competencies": [],
        },
        "cv_data": cv_data,
        "match_result": MatchingOutput(status="EVALUATED", overall_score=50.0),
        "decision_outcome": "REJECTED",
        "decision_source": "HR",
    }

    request = build_career_path_request_from_state(state)

    assert request is not None
    assert request.decision.outcome.value == "REJECTED"
    assert request.decision.source.value == "HR"
    assert request.decision.is_final
    assert request.policy.allow_candidate_auto_delivery


@pytest.mark.asyncio
@patch("app.agents.orchestrator.matching_agent.evaluate_async")
async def test_knockout_at_fifty_points_does_not_require_human_review(mock_evaluate):
    mock_evaluate.return_value = MatchingOutput(
        status="REJECTED",
        overall_score=50.0,
        rejection_reason="Missing mandatory competency",
    )
    state = {
        "application_id": "app_knockout",
        "job_data": {
            "job_id": "job_java",
            "job_family": "Engineering",
            "career_level": "Mid",
            "required_competencies": [],
        },
        "cv_data": CVExtractionResponse(
            status=ExtractionStatus.SUCCESS,
            personal_info=PersonalInfo(name="Test Candidate"),
        ),
        "hr_preferences": "",
        "telemetry": {},
    }

    result = await match_node(state)

    assert result["match_result"].status == "REJECTED"
    assert result["needs_human_review"] is False


@pytest.mark.asyncio
@patch("app.agents.extractor_agent.agent.process_cv")
@patch("app.agents.matcher_agent.agent.matching_agent.evaluate_async")
@patch("app.agents.career_path_agent.agent.career_path_agent.generate")
async def test_orchestrator_full_flow(
    mock_career_generate,
    mock_matcher_eval,
    mock_extract_process,
):
    mock_cv = CVExtractionResponse(
        status=ExtractionStatus.SUCCESS,
        personal_info=PersonalInfo(name="Nguyen Van B"),
        skills=["Python", "PostgreSQL"],
    )
    mock_extract_process.return_value = mock_cv

    mock_match = MatchingOutput(
        status="EVALUATED",
        overall_score=45.0,
        hard_skill_score=40.0,
    )
    mock_matcher_eval.return_value = mock_match

    mock_career_output = CareerPathOutput(
        application_id="app_456",
        status=CareerPathStatus.GENERATED,
        delivery_status=DeliveryStatus.BLOCKED,
        diagnostics=CareerPathDiagnostics(),
        provenance=CareerPathProvenance(
            agent_version="1.0",
            policy_version="1.0",
            decision_id="dec_456",
            job_snapshot_version="1.0",
            candidate_snapshot_version="1.0",
            matching_snapshot_version="1.0",
        ),
    )
    mock_career_generate.return_value = mock_career_output

    initial_state = {
        "application_id": "app_456",
        "file_content": b"dummy pdf bytes",
        "filename": "candidate_cv.pdf",
        "job_data": {"job_id": "backend_dev", "title": "Backend Developer"},
        "hr_preferences": "",
        "cv_data": None,
        "match_result": None,
        "career_path_result": None,
        "needs_human_review": False,
    }

    config = {"configurable": {"thread_id": "test_thread_1"}}
    final_state = await agent_graph.ainvoke(initial_state, config)

    assert final_state["cv_data"] == mock_cv
    assert final_state["match_result"] == mock_match
    assert final_state["career_path_result"] == mock_career_output
    assert "telemetry" in final_state
    assert "total_pipeline_ms" in final_state["telemetry"]
    assert mock_extract_process.called
    assert mock_matcher_eval.called
    assert mock_career_generate.called
