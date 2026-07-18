from app.agents.career_path_agent.gap_analyzer import analyze_gaps
from app.agents.career_path_agent.prioritization_engine import prioritize_gaps
from app.agents.career_path_agent.resource_catalog import ResourceCatalog
from app.agents.career_path_agent.roadmap_builder import (
    build_internal_review_output,
    build_roadmap,
)
from app.agents.career_path_agent.roadmap_validator import validate_roadmap
from app.core.schemas import DeliveryStatus, GapPriority


def test_deterministic_skeleton_covers_every_critical_gap(
    career_path_request, approved_python_resource
):
    analysis = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    )
    catalog = ResourceCatalog([approved_python_resource])

    first = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)
    second = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)
    covered = {gap_id for phase in first.phases for gap_id in phase.addressed_gap_ids}
    critical = {
        gap.gap_id
        for gap in analysis.roadmap_gaps
        if gap.priority in {GapPriority.P0, GapPriority.P1}
    }

    assert first == second
    assert critical <= covered
    assert sum(phase.duration_weeks for phase in first.phases) <= 8
    assert all(phase.deliverables for phase in first.phases)
    assert all(phase.assessment.acceptance_criteria for phase in first.phases)


def test_missing_resource_warns_but_does_not_invent_link(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.approved_resources = []
    analysis = prioritize_gaps(analyze_gaps(request), request)

    draft = build_roadmap(analysis.roadmap_gaps, request, ResourceCatalog([]))

    assert all(not phase.resource_ids for phase in draft.phases)
    assert any(warning.startswith("NO_APPROVED_RESOURCE") for warning in draft.warnings)


def test_unknown_critical_gap_starts_with_assessment(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.matching.evidence_matrix = []
    analysis = prioritize_gaps(analyze_gaps(request), request)

    draft = build_roadmap(analysis.roadmap_gaps, request, ResourceCatalog([]))

    assert "Đánh giá" in draft.phases[0].title


def test_no_model_output_is_internal_and_not_delivery_eligible(
    career_path_request, approved_python_resource
):
    analysis = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    )
    catalog = ResourceCatalog([approved_python_resource])
    draft = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)
    validation = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    output = build_internal_review_output(
        career_path_request, analysis, draft, validation
    )

    assert output.candidate_view is None
    assert output.delivery_status == DeliveryStatus.REVIEW_REQUIRED


def test_candidate_max_duration_is_a_ceiling_not_a_target(career_path_request):
    request = career_path_request.model_copy(deep=True)
    request.constraints.max_duration_weeks = 20
    analysis = prioritize_gaps(analyze_gaps(request), request)

    draft = build_roadmap(
        analysis.roadmap_gaps,
        request,
        ResourceCatalog(request.approved_resources),
    )

    assert draft.total_duration_weeks == request.policy.default_duration_weeks
