from app.agents.career_path_agent.gap_analyzer import analyze_gaps
from app.agents.career_path_agent.prioritization_engine import prioritize_gaps
from app.agents.career_path_agent.renderer import render_candidate_view
from app.agents.career_path_agent.resource_catalog import ResourceCatalog
from app.agents.career_path_agent.roadmap_builder import build_roadmap
from app.agents.career_path_agent.roadmap_validator import validate_roadmap


def test_renderer_uses_cautious_allowlisted_language(
    career_path_request, approved_python_resource
):
    analysis = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    )
    catalog = ResourceCatalog([approved_python_resource])
    draft = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)

    view = render_candidate_view(
        draft, analysis.all_gaps, career_path_request, catalog
    )
    payload = view.model_dump_json()

    assert "Hồ sơ hiện chưa thể hiện rõ" in payload
    assert "Internal rationale" not in payload
    assert "overall_score" not in payload
    assert "hr_recommendation" not in payload
    assert "private@example.com" not in payload
    assert "gap:python" not in payload
    assert "activity:python" not in payload
    assert "resource-python-1" not in payload
    assert view.message
    assert view.total_duration_weeks == draft.total_duration_weeks
    assert view.hours_per_week == draft.hours_per_week
    assert view.total_estimated_hours == sum(
        activity.estimated_hours
        for phase in draft.phases
        for activity in phase.activities
    )
    assert view.phases[0].week_start == 1
    assert view.phases[-1].week_end == draft.total_duration_weeks
    assert view.next_action
    validation = validate_roadmap(
        draft,
        analysis.roadmap_gaps,
        career_path_request,
        catalog,
        candidate_view=view,
    )
    assert "CANDIDATE_VIEW_CONTAINS_INTERNAL_OR_PROMISSORY_TEXT" in validation.errors
    assert "CANDIDATE_VIEW_CONTAINS_DIRECT_CONTACT_PII" not in validation.errors
    assert "CANDIDATE_VIEW_CONTAINS_UNAPPROVED_URL" not in validation.errors


def test_renderer_does_not_change_delivery_status(
    career_path_request, approved_python_resource
):
    analysis = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    )
    catalog = ResourceCatalog([approved_python_resource])
    draft = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)

    view = render_candidate_view(
        draft, analysis.all_gaps, career_path_request, catalog
    )

    assert "delivery_status" not in view.model_dump()


def test_validator_rejects_internal_rationale_in_candidate_view(
    career_path_request, approved_python_resource
):
    analysis = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    )
    catalog = ResourceCatalog([approved_python_resource])
    draft = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)
    view = render_candidate_view(
        draft, analysis.all_gaps, career_path_request, catalog
    )
    view.summary = career_path_request.decision.approved_rationale

    result = validate_roadmap(
        draft,
        analysis.roadmap_gaps,
        career_path_request,
        catalog,
        candidate_view=view,
    )

    assert "CANDIDATE_VIEW_CONTAINS_INTERNAL_VALUE" in result.errors
