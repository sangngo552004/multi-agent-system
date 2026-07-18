from datetime import timedelta

from app.agents.career_path_agent.gap_analyzer import analyze_gaps
from app.agents.career_path_agent.prioritization_engine import prioritize_gaps
from app.agents.career_path_agent.renderer import render_candidate_view
from app.agents.career_path_agent.resource_catalog import ResourceCatalog
from app.agents.career_path_agent.roadmap_builder import (
    build_internal_review_output,
    build_roadmap,
)
from app.agents.career_path_agent.roadmap_validator import (
    validate_delivery,
    validate_roadmap,
)
from app.core.schemas import DeliveryStatus, RoadmapPhase


def _build(career_path_request, approved_python_resource):
    analysis = prioritize_gaps(
        analyze_gaps(career_path_request), career_path_request
    )
    catalog = ResourceCatalog([approved_python_resource])
    draft = build_roadmap(analysis.roadmap_gaps, career_path_request, catalog)
    return analysis, catalog, draft


def test_valid_deterministic_plan_passes(career_path_request, approved_python_resource):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert result.is_valid
    assert result.metrics.critical_gap_count == result.metrics.covered_critical_gap_count


def test_detects_missing_critical_coverage(
    career_path_request, approved_python_resource
):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    draft.phases[0].addressed_gap_ids = []

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert not result.is_valid
    assert any(error.startswith("MISSING_CRITICAL_GAP_COVERAGE") for error in result.errors)


def test_detects_dependency_cycle(career_path_request, approved_python_resource):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    if len(draft.phases) == 1:
        copy = RoadmapPhase.model_validate(
            {
                **draft.phases[0].model_dump(),
                "phase_id": "phase:2",
                "prerequisite_phase_ids": ["phase:1"],
            }
        )
        draft.phases.append(copy)
    draft.phases[0].prerequisite_phase_ids = [draft.phases[-1].phase_id]
    draft.total_duration_weeks = sum(p.duration_weeks for p in draft.phases)

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert "DEPENDENCY_CYCLE" in result.errors


def test_detects_unknown_resource(career_path_request, approved_python_resource):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    draft.phases[0].resource_ids.append("invented-resource")

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert "UNKNOWN_RESOURCE:invented-resource" in result.errors


def test_detects_incompatible_resource(
    career_path_request, approved_python_resource
):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    communication_phase = next(
        phase
        for phase in draft.phases
        if "gap:communication" in phase.addressed_gap_ids
    )
    communication_phase.resource_ids.append(approved_python_resource.resource_id)

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert "INCOMPATIBLE_RESOURCE:resource-python-1" in result.errors


def test_detects_workload_over_capacity(
    career_path_request, approved_python_resource
):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    draft.phases[0].activities[0].estimated_hours = 999

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert any(
        error.startswith("PHASE_WORKLOAD_EXCEEDS_CAPACITY")
        for error in result.errors
    )


def test_detects_activity_week_outside_phase(
    career_path_request, approved_python_resource
):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    draft.phases[0].activities[0].week_end = (
        draft.phases[0].duration_weeks + 1
    )

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert any(
        error.startswith("INVALID_ACTIVITY_WEEK_RANGE")
        for error in result.errors
    )


def test_candidate_quality_rejects_unsupported_reviewer_and_benchmark(
    career_path_request, approved_python_resource
):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    view = render_candidate_view(
        draft, analysis.all_gaps, career_path_request, catalog
    )
    view.summary = (
        "Lộ trình phát triển được cá nhân hóa cho vị trí mục tiêu và tập trung vào "
        "các sản phẩm thực hành có thể kiểm tra rõ ràng."
    )
    view.phases[0].assessment.method = "Đánh giá bởi Hội đồng chuyên môn"
    view.phases[0].assessment.acceptance_criteria = [
        "Dịch vụ xử lý tối thiểu 500 requests/giây trong bài kiểm thử tải đã chuẩn bị.",
        "Thử nghiệm sử dụng tối thiểu 100 concurrent users và không có lỗi rò rỉ bộ nhớ.",
    ]
    view.message = (
        "Chúng tôi rất ấn tượng với hồ sơ của bạn và đã chuẩn bị tốt nhất một lộ "
        "trình phát triển có thời hạn, sản phẩm thực hành, tiêu chí đánh giá và "
        "hành động khởi đầu rõ ràng để bạn tham khảo cho vị trí mục tiêu."
    )
    view.phases[1].assessment.method = "Self-review checklist"

    result = validate_roadmap(
        draft,
        analysis.roadmap_gaps,
        career_path_request,
        catalog,
        candidate_view=view,
    )

    assert "CANDIDATE_VIEW_ASSUMES_REVIEWER_AVAILABILITY" in result.errors
    assert "CANDIDATE_VIEW_HAS_UNSUPPORTED_PERFORMANCE_TARGET" in result.errors
    assert "CANDIDATE_VIEW_HAS_UNSUPPORTED_ABSOLUTE_CLAIM" in result.errors
    assert "CANDIDATE_VIEW_HAS_UNSUPPORTED_PRAISE" in result.errors
    assert "CANDIDATE_VIEW_LANGUAGE_INCONSISTENT" in result.errors


def test_policy_blocks_auto_delivery(
    career_path_request, approved_python_resource
):
    analysis, catalog, draft = _build(
        career_path_request, approved_python_resource
    )
    validation = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )
    output = build_internal_review_output(
        career_path_request, analysis, draft, validation
    )
    output.delivery_status = DeliveryStatus.ELIGIBLE

    result = validate_delivery(output, career_path_request.policy)

    assert "AUTO_DELIVERY_NOT_ALLOWED_BY_POLICY" in result.errors
    assert "ELIGIBLE_OUTPUT_REQUIRES_GENERATED_STATUS" in result.errors


def test_detects_stale_resource(career_path_request, approved_python_resource):
    analysis, _, draft = _build(career_path_request, approved_python_resource)
    stale = approved_python_resource.model_copy(deep=True)
    stale.last_verified_at = stale.last_verified_at - timedelta(days=500)
    catalog = ResourceCatalog([stale])

    result = validate_roadmap(
        draft, analysis.roadmap_gaps, career_path_request, catalog
    )

    assert "STALE_RESOURCE:resource-python-1" in result.errors
