from app.agents.career_path_agent.gap_analyzer import analyze_gaps
from app.agents.career_path_agent.prioritization_engine import prioritize_gaps
from app.core.schemas import GapActionMode, GapAssessment, GapPriority


def test_assigns_transparent_priority_and_action_modes(career_path_request):
    result = prioritize_gaps(analyze_gaps(career_path_request), career_path_request)
    by_id = {gap.competency_id: gap for gap in result.roadmap_gaps}

    assert by_id["python"].priority == GapPriority.P0
    assert by_id["communication"].priority == GapPriority.P1
    assert by_id["python"].action_mode == GapActionMode.PRACTICE
    assert by_id["communication"].action_mode == GapActionMode.ASSESS_FIRST


def test_unknown_mandatory_keeps_p0_but_assesses_first(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.matching.evidence_matrix = [
        item
        for item in request.matching.evidence_matrix
        if item.competency_id != "python"
    ]
    analysis = analyze_gaps(request)
    result = prioritize_gaps(analysis, request)
    python_gap = next(
        gap for gap in result.roadmap_gaps if gap.competency_id == "python"
    )

    assert python_gap.assessment == GapAssessment.UNKNOWN
    assert python_gap.priority == GapPriority.P0
    assert python_gap.action_mode == GapActionMode.ASSESS_FIRST


def test_priority_is_stable_when_input_order_changes(career_path_request):
    first = prioritize_gaps(analyze_gaps(career_path_request), career_path_request)
    request = career_path_request.model_copy(deep=True)
    request.job.required_competencies.reverse()
    request.matching.evidence_matrix.reverse()
    second = prioritize_gaps(analyze_gaps(request), request)

    assert [gap.competency_id for gap in first.roadmap_gaps] == [
        gap.competency_id for gap in second.roadmap_gaps
    ]
