import pytest
from pydantic import ValidationError

from app.agents.career_path_agent.snapshot_adapter import (
    build_candidate_snapshot,
    build_job_snapshot,
    build_matching_snapshot,
)
from app.core.schemas import (
    Competency,
    CVExtractionResponse,
    JobConfiguration,
    MatchingOutput,
    PersonalInfo,
    ScoringBreakdown,
)


def test_candidate_snapshot_strips_direct_contact_pii_without_mutation():
    cv = CVExtractionResponse(
        status="success",
        personal_info=PersonalInfo(
            name="Candidate", email="private@example.com", phone="0901234567"
        ),
        skills=["Python"],
    )

    snapshot = build_candidate_snapshot(cv)
    snapshot.skills.append("Go")

    assert "personal_info" not in snapshot.model_dump()
    assert cv.personal_info.email == "private@example.com"
    assert cv.skills == ["Python"]


def test_matching_snapshot_strips_scores_hr_text_and_breakdown():
    matching = MatchingOutput(
        overall_score=12,
        rejection_reason="Internal rejection",
        hr_recommendation="Do not share",
        scoring_breakdown=ScoringBreakdown(rejection_reason="Knockout"),
    )

    payload = build_matching_snapshot(matching).model_dump()

    assert "overall_score" not in payload
    assert "rejection_reason" not in payload
    assert "hr_recommendation" not in payload
    assert "scoring_breakdown" not in payload


def test_job_snapshot_freezes_semantic_target_and_omits_rules():
    job = JobConfiguration(
        job_id="job-1",
        job_family="Engineering",
        career_level="Senior",
        required_competencies=[
            Competency(
                competency_id="python",
                name="Python",
                category="HARD_SKILL",
                weight=1,
                required_level=3,
                is_mandatory=True,
            )
        ],
        institutional_rules=[{"school": "preferred"}],
    )

    snapshot = build_job_snapshot(
        job, {"python": "Build maintainable production services."}
    )

    assert "institutional_rules" not in snapshot.model_dump()
    assert snapshot.required_competencies[0].required_level_description


def test_missing_level_description_is_preserved_as_missing_for_quality_gate():
    job = JobConfiguration(
        job_id="job-1",
        job_family="Engineering",
        career_level="Senior",
        required_competencies=[
            Competency(
                competency_id="python",
                name="Python",
                category="HARD_SKILL",
                weight=1,
                required_level=3,
                is_mandatory=True,
            )
        ],
    )

    snapshot = build_job_snapshot(job, {})

    assert snapshot.required_competencies[0].required_level_description is None


def test_career_path_request_rejects_raw_upstream_fields(career_path_request):
    payload = career_path_request.model_dump()
    payload["cv_data"] = {"personal_info": {"email": "private@example.com"}}

    with pytest.raises(ValidationError):
        type(career_path_request).model_validate(payload)
