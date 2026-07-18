"""Deterministic roadmap skeleton builder used when no model is involved."""

from __future__ import annotations

from collections import defaultdict

from app.agents.career_path_agent.resource_catalog import ResourceCatalog
from app.core.schemas import (
    CareerPathDiagnostics,
    CareerPathDraft,
    CareerPathOutput,
    CareerPathProvenance,
    CareerPathRequest,
    CareerPathStatus,
    CompetencyGap,
    DataQualityGrade,
    DeliveryStatus,
    GapActionMode,
    GapAnalysisResult,
    GapPriority,
    RoadmapActivity,
    RoadmapAssessment,
    RoadmapDeliverable,
    RoadmapPhase,
    RoadmapValidationResult,
)


def resolve_planning_limits(request: CareerPathRequest) -> tuple[int, int, int]:
    """Resolve request constraints without allowing them to exceed policy."""

    policy = request.policy
    hours = request.constraints.hours_per_week or policy.default_hours_per_week
    duration = min(policy.default_duration_weeks, policy.max_duration_weeks)
    if request.constraints.max_duration_weeks:
        duration = min(duration, request.constraints.max_duration_weeks)
    phase_count = min(policy.max_phases, duration)
    return hours, duration, phase_count


def _group_key(gap: CompetencyGap) -> tuple[int, str]:
    if gap.action_mode == GapActionMode.ASSESS_FIRST:
        return (0, "ASSESS_FIRST")
    order = {GapPriority.P0: 1, GapPriority.P1: 2, GapPriority.P2: 3}
    return (order.get(gap.priority, 3), (gap.priority or GapPriority.P2).value)


def _group_gaps(
    gaps: list[CompetencyGap], max_phases: int
) -> list[list[CompetencyGap]]:
    grouped: dict[tuple[int, str], list[CompetencyGap]] = defaultdict(list)
    for gap in gaps:
        grouped[_group_key(gap)].append(gap)
    groups = [grouped[key] for key in sorted(grouped)]
    while len(groups) > max_phases:
        overflow = groups.pop()
        groups[-1].extend(overflow)
    return groups


def _phase_title(gaps: list[CompetencyGap], language: str) -> str:
    if any(gap.action_mode == GapActionMode.ASSESS_FIRST for gap in gaps):
        return "Đánh giá và xác lập điểm xuất phát" if language == "vi" else "Assess the starting point"
    priority = gaps[0].priority.value if gaps[0].priority else "P2"
    return (
        f"Phát triển nhóm năng lực {priority}"
        if language == "vi"
        else f"Develop {priority} competencies"
    )


def _activity(
    gap: CompetencyGap,
    hours: int,
    duration_weeks: int,
    language: str,
) -> RoadmapActivity:
    if gap.action_mode == GapActionMode.ASSESS_FIRST:
        description = (
            f"Thực hiện bài đánh giá có tiêu chí cho {gap.competency_name}."
            if language == "vi"
            else f"Complete a criteria-based assessment for {gap.competency_name}."
        )
    elif gap.action_mode == GapActionMode.BUILD_EVIDENCE:
        description = (
            f"Xây dựng bài thực hành minh chứng cho {gap.competency_name}."
            if language == "vi"
            else f"Build a practical evidence artifact for {gap.competency_name}."
        )
    else:
        description = (
            f"Luyện tập {gap.competency_name} theo yêu cầu mục tiêu."
            if language == "vi"
            else f"Practice {gap.competency_name} against the target requirements."
        )
    return RoadmapActivity(
        activity_id=f"activity:{gap.competency_id}",
        title=gap.competency_name,
        description=description,
        week_start=1,
        week_end=duration_weeks,
        estimated_hours=max(1, hours),
    )


def _deliverable(gap: CompetencyGap, language: str) -> RoadmapDeliverable:
    description = (
        "Một sản phẩm có thể được reviewer kiểm tra theo tiêu chí của giai đoạn."
        if language == "vi"
        else "An artifact a reviewer can check against the phase criteria."
    )
    return RoadmapDeliverable(
        deliverable_id=f"deliverable:{gap.competency_id}",
        title=f"Minh chứng {gap.competency_name}" if language == "vi" else f"{gap.competency_name} evidence",
        description=description,
    )


def build_roadmap(
    gaps: list[CompetencyGap],
    request: CareerPathRequest,
    catalog: ResourceCatalog,
) -> CareerPathDraft:
    """Create a measurable skeleton covering every supplied prioritized gap."""

    approved_ids = {
        resource.resource_id for resource in request.approved_resources
    }
    unapproved_catalog_ids = catalog.resource_ids - approved_ids
    if unapproved_catalog_ids:
        raise ValueError("catalog contains resources not approved by the request")
    planned = [gap.model_copy(deep=True) for gap in gaps if gap.priority]
    if not planned:
        raise ValueError("At least one prioritized roadmap gap is required")
    planned.sort(key=lambda gap: (_group_key(gap), -gap.weight, gap.competency_id))
    hours, duration, max_phases = resolve_planning_limits(request)
    groups = _group_gaps(planned, max_phases)
    base_duration, remainder = divmod(duration, len(groups))
    language = request.constraints.preferred_language
    phases: list[RoadmapPhase] = []
    warnings: list[str] = []

    for index, group in enumerate(groups):
        phase_id = f"phase:{index + 1}"
        phase_duration = base_duration + (1 if index < remainder else 0)
        activity_hours = max(1, phase_duration * hours // len(group))
        resource_ids: list[str] = []
        for gap in group:
            selected = catalog.select_for_gap(
                gap, request.constraints, request.policy
            )
            if not selected:
                warnings.append(f"NO_APPROVED_RESOURCE:{gap.competency_id}")
            resource_ids.extend(resource.resource_id for resource in selected)

        criterion_prefix = "Đạt tiêu chí mục tiêu" if language == "vi" else "Meets the target criteria"
        phases.append(
            RoadmapPhase(
                phase_id=phase_id,
                title=_phase_title(group, language),
                duration_weeks=phase_duration,
                addressed_gap_ids=[gap.gap_id for gap in group],
                prerequisite_phase_ids=[phases[-1].phase_id] if phases else [],
                activities=[
                    _activity(
                        gap,
                        activity_hours,
                        phase_duration,
                        language,
                    )
                    for gap in group
                ],
                deliverables=[_deliverable(gap, language) for gap in group],
                assessment=RoadmapAssessment(
                    method="Reviewer rubric",
                    acceptance_criteria=[
                        f"{criterion_prefix}: {gap.competency_name}"
                        for gap in group
                    ],
                ),
                resource_ids=sorted(set(resource_ids)),
            )
        )

    summary = (
        "Lộ trình nội bộ được tạo theo các khoảng trống ưu tiên và cần được kiểm định trước khi sử dụng."
        if language == "vi"
        else "An internal roadmap based on prioritized gaps; validation is required before use."
    )
    return CareerPathDraft(
        candidate_message=(
            "Dựa trên những thông tin hiện có, chúng tôi đã chuẩn bị một lộ trình phát triển có giới hạn thời gian để bạn tham khảo. Lộ trình này ưu tiên việc xác nhận minh chứng còn thiếu và xây dựng sản phẩm thực hành có thể được đánh giá rõ ràng."
            if language == "vi"
            else "Based on the available information, we prepared a time-bounded development roadmap for your consideration. It prioritizes confirming missing evidence and building practical artifacts that can be reviewed clearly."
        ),
        summary=summary,
        total_duration_weeks=sum(phase.duration_weeks for phase in phases),
        hours_per_week=hours,
        phases=phases,
        checkpoints=[
            phase.assessment.acceptance_criteria[0] for phase in phases
        ],
        warnings=sorted(set(warnings)),
    )


def build_internal_review_output(
    request: CareerPathRequest,
    analysis: GapAnalysisResult,
    draft: CareerPathDraft,
    validation: RoadmapValidationResult,
    *,
    agent_version: str = "career-path-core/1.0",
) -> CareerPathOutput:
    """Package no-model work as non-deliverable internal output."""

    if not validation.is_valid:
        status = CareerPathStatus.FAILED
        delivery_status = DeliveryStatus.BLOCKED
    elif analysis.data_quality == DataQualityGrade.INSUFFICIENT:
        status = CareerPathStatus.INSUFFICIENT_INPUT
        delivery_status = DeliveryStatus.BLOCKED
    else:
        status = CareerPathStatus.NEEDS_HUMAN_REVIEW
        delivery_status = DeliveryStatus.REVIEW_REQUIRED

    return CareerPathOutput(
        status=status,
        delivery_status=delivery_status,
        application_id=request.application_id,
        decision_id=request.decision.decision_id,
        target_job=request.job.model_copy(deep=True),
        gaps=[gap.model_copy(deep=True) for gap in analysis.all_gaps],
        internal_draft=draft.model_copy(deep=True),
        candidate_view=None,
        diagnostics=CareerPathDiagnostics(
            validation_errors=list(validation.errors),
            validation_warnings=list(validation.warnings),
            data_quality=analysis.data_quality,
            limitations=list(analysis.limitations),
            requires_human_review=True,
        ),
        provenance=CareerPathProvenance(
            agent_version=agent_version,
            policy_version=request.policy.version,
            decision_id=request.decision.decision_id,
            job_snapshot_version=request.job.snapshot_version,
            candidate_snapshot_version=request.candidate.snapshot_version,
            matching_snapshot_version=request.matching.snapshot_version,
            resource_catalog_versions=sorted(
                {
                    resource.catalog_version
                    for resource in request.approved_resources
                }
            ),
        ),
    )
