from app.agents.career_path_agent.gap_analyzer import analyze_gaps
from app.core.schemas import (
    DataQualityGrade,
    EvidenceSource,
    GapAssessment,
    MissingCriterion,
)


def test_builds_complete_non_pedigree_ledger(career_path_request):
    result = analyze_gaps(career_path_request)

    assert result.is_applicable
    assert [gap.competency_id for gap in result.all_gaps] == [
        "communication",
        "delivery",
        "python",
    ]
    assert {gap.competency_id for gap in result.strengths} == {"delivery"}
    assert {gap.competency_id for gap in result.roadmap_gaps} == {
        "communication",
        "python",
    }


def test_distinguishes_partial_not_evidenced_and_met(career_path_request):
    by_id = {
        gap.competency_id: gap for gap in analyze_gaps(career_path_request).all_gaps
    }

    assert by_id["python"].assessment == GapAssessment.PARTIAL
    assert by_id["communication"].assessment == GapAssessment.NOT_EVIDENCED
    assert by_id["delivery"].assessment == GapAssessment.MET
    assert all(gap.observed_level is None for gap in by_id.values())


def test_non_final_decision_fails_closed(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.decision.is_final = False

    result = analyze_gaps(request)

    assert not result.is_applicable
    assert result.applicability_reason == "DECISION_NOT_FINAL"


def test_missing_mandatory_level_description_is_insufficient(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.job.required_competencies[0].required_level_description = None

    result = analyze_gaps(request)

    assert result.data_quality == DataQualityGrade.INSUFFICIENT
    assert result.requires_human_review


def test_vector_fallback_is_limited_and_requires_review(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.matching.evidence_matrix = [
        item
        for item in request.matching.evidence_matrix
        if item.competency_id != "python"
    ]
    request.matching.missing_criteria = [
        MissingCriterion(
            skill="Python",
            criticality="HIGH",
            reason="Target-level evidence was not found.",
        )
    ]

    result = analyze_gaps(request)
    gap = next(item for item in result.all_gaps if item.competency_id == "python")

    assert gap.assessment == GapAssessment.NOT_EVIDENCED
    assert gap.evidence_references[0].source == EvidenceSource.VECTOR_MATCH
    assert gap.requires_human_review
    assert result.data_quality == DataQualityGrade.LIMITED
