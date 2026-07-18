from datetime import datetime, timedelta, timezone

from app.agents.career_path_agent.gap_analyzer import analyze_gaps
from app.agents.career_path_agent.prioritization_engine import prioritize_gaps
from app.agents.career_path_agent.resource_catalog import ResourceCatalog


def test_selects_only_approved_compatible_fresh_resources(
    career_path_request, approved_python_resource
):
    request = career_path_request.model_copy(deep=True)
    request.constraints.preferred_formats = ["course"]
    request.constraints.max_budget = "FREE"
    gap = prioritize_gaps(
        analyze_gaps(request), request
    ).roadmap_gaps[0]
    catalog = ResourceCatalog([approved_python_resource])

    selected = catalog.select_for_gap(gap, request.constraints, request.policy)

    assert [item.resource_id for item in selected] == ["resource-python-1"]


def test_excludes_stale_resources(career_path_request, approved_python_resource):
    resource = approved_python_resource.model_copy(deep=True)
    resource.last_verified_at = datetime.now(timezone.utc) - timedelta(days=500)
    gap = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    ).roadmap_gaps[0]

    selected = ResourceCatalog([resource]).select_for_gap(
        gap, career_path_request.constraints, career_path_request.policy
    )

    assert selected == []


def test_get_returns_a_copy(approved_python_resource):
    catalog = ResourceCatalog([approved_python_resource])
    resource = catalog.get(approved_python_resource.resource_id)
    resource.title = "Changed"

    assert catalog.get(approved_python_resource.resource_id).title != "Changed"
