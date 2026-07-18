"""Structural, referential, and candidate-safety validation for roadmaps."""

from __future__ import annotations

import re

from app.agents.career_path_agent.resource_catalog import ResourceCatalog
from app.agents.career_path_agent.roadmap_builder import resolve_planning_limits
from app.core.schemas import (
    CandidateCareerPathView,
    CandidateRoadmapPhase,
    CareerPathDraft,
    CareerPathOutput,
    CareerPathRequest,
    CompetencyGap,
    DeliveryStatus,
    GapAssessment,
    GapPriority,
    PlanningPolicy,
    RoadmapPhase,
    RoadmapValidationMetrics,
    RoadmapValidationResult,
)

_FORBIDDEN_TEXT = (
    "overall_score",
    "hard_skill_score",
    "soft_skill_score",
    "experience_score",
    "bonus_score",
    "hr_recommendation",
    "approved_rationale",
    "match score",
    "điểm phù hợp",
    "điểm tuyển dụng",
    "chắc chắn được tuyển",
    "guaranteed hire",
    "lộ trình nội bộ",
    "kiểm định trước khi sử dụng",
    "internal roadmap",
    "validation is required before use",
    "ignore previous instructions",
    "disregard previous instructions",
    "javascript:",
)
_UNSUPPORTED_LACK_TEXT = (
    "không có kỹ năng",
    "không biết",
    "lacks the skill",
    "has no skill",
)
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_PHONE = re.compile(r"(?<!\w)(?:\+?\d[\d .()-]{7,}\d)(?!\w)")
_URL = re.compile(r"(?:https?://|www\.)[^\s\"\\]+")
_HTML_TAG = re.compile(r"<[^>]+>")
_UNSUPPORTED_REVIEWER = re.compile(
    r"\b(?:hội đồng chuyên môn|hội đồng đánh giá|expert panel|review board)\b",
    re.IGNORECASE,
)
_UNSUPPORTED_PERFORMANCE_TARGET = re.compile(
    r"\b\d+(?:[.,]\d+)?\s*(?:requests?\s*/\s*(?:giây|second)|req\s*/\s*s|rps|ms\b|%|concurrent users?|người dùng đồng thời)",
    re.IGNORECASE,
)
_UNSUPPORTED_ABSOLUTE_CLAIM = re.compile(
    r"\b(?:không (?:có|chứa) (?:lỗi )?rò rỉ bộ nhớ|no memory leaks?|zero memory leaks?)\b",
    re.IGNORECASE,
)
_UNSUPPORTED_PRAISE = re.compile(
    r"\b(?:rất ấn tượng|vô cùng ấn tượng|highly impressed|very impressed|chuẩn bị tốt nhất)\b",
    re.IGNORECASE,
)
_ENGLISH_ASSESSMENT_METHOD = re.compile(
    r"\b(?:self-review|review checklist|automated performance testing|documented baseline comparison)\b",
    re.IGNORECASE,
)
_INTERNAL_PRIORITY = re.compile(r"(?<!\w)P[012](?!\w)", re.IGNORECASE)
_WEEK_MILESTONE = re.compile(r"\b(?:tuần|week)\s*\d+", re.IGNORECASE)
_GENERIC_CRITERIA = (
    "đạt tiêu chí mục tiêu",
    "đáp ứng tiêu chí mục tiêu",
    "meets the target criteria",
    "meet the target criteria",
)
_GENERIC_SUMMARIES = (
    "lộ trình tập trung vào việc xác nhận điểm xuất phát, thực hành và tạo minh chứng theo các tiêu chí mục tiêu.",
    "lộ trình nội bộ được tạo theo các khoảng trống ưu tiên và cần được kiểm định trước khi sử dụng.",
    "the roadmap focuses on assessing the starting point, practicing, and building evidence against target criteria.",
    "an internal roadmap based on prioritized gaps; validation is required before use.",
)


def _has_cycle(phases) -> bool:
    graph = {phase.phase_id: set(phase.prerequisite_phase_ids) for phase in phases}
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node: str) -> bool:
        if node in visiting:
            return True
        if node in visited:
            return False
        visiting.add(node)
        if any(dependency in graph and visit(dependency) for dependency in graph[node]):
            return True
        visiting.remove(node)
        visited.add(node)
        return False

    return any(visit(node) for node in graph)


def _candidate_text(view: CandidateCareerPathView) -> str:
    return view.model_dump_json().casefold()


def _validate_phase(
    phase: RoadmapPhase,
    *,
    draft: CareerPathDraft,
    gap_by_id: dict[str, CompetencyGap],
    phase_ids: set[str],
    approved_resource_ids: set[str],
    request: CareerPathRequest,
    catalog: ResourceCatalog,
) -> list[str]:
    errors: list[str] = []
    unknown_dependencies = sorted(set(phase.prerequisite_phase_ids) - phase_ids)
    if unknown_dependencies:
        errors.append(
            f"UNKNOWN_PREREQUISITE:{phase.phase_id}:{','.join(unknown_dependencies)}"
        )
    if not phase.deliverables:
        errors.append(f"MISSING_DELIVERABLE:{phase.phase_id}")
    if not phase.assessment.acceptance_criteria:
        errors.append(f"MISSING_ACCEPTANCE_CRITERIA:{phase.phase_id}")
    if sum(item.estimated_hours for item in phase.activities) > (
        phase.duration_weeks * draft.hours_per_week
    ):
        errors.append(f"PHASE_WORKLOAD_EXCEEDS_CAPACITY:{phase.phase_id}")
    covered_weeks: set[int] = set()
    for activity in phase.activities:
        if (
            activity.week_start > activity.week_end
            or activity.week_end > phase.duration_weeks
        ):
            errors.append(
                f"INVALID_ACTIVITY_WEEK_RANGE:{phase.phase_id}:{activity.activity_id}"
            )
            continue
        covered_weeks.update(
            range(activity.week_start, activity.week_end + 1)
        )
    expected_weeks = set(range(1, phase.duration_weeks + 1))
    if covered_weeks != expected_weeks:
        errors.append(f"ACTIVITY_WEEKS_NOT_COVERED:{phase.phase_id}")

    addressed_gaps = [
        gap_by_id[gap_id]
        for gap_id in phase.addressed_gap_ids
        if gap_id in gap_by_id
    ]
    for resource_id in phase.resource_ids:
        if resource_id not in approved_resource_ids:
            errors.append(f"RESOURCE_NOT_APPROVED_FOR_REQUEST:{resource_id}")
        resource = catalog.get(resource_id)
        if resource is None:
            errors.append(f"UNKNOWN_RESOURCE:{resource_id}")
        elif not catalog.is_fresh(resource, request.policy):
            errors.append(f"STALE_RESOURCE:{resource_id}")
        elif not any(
            catalog.is_compatible(
                resource, gap, request.constraints, request.policy
            )
            for gap in addressed_gaps
        ):
            errors.append(f"INCOMPATIBLE_RESOURCE:{resource_id}")
    return errors


def _validate_candidate_phase_quality(
    phase: CandidateRoadmapPhase,
    index: int,
) -> list[str]:
    errors: list[str] = []
    if _INTERNAL_PRIORITY.search(phase.title):
        errors.append(f"CANDIDATE_PHASE_EXPOSES_PRIORITY:{index}")
    minimum_activities = min(3, phase.duration_weeks)
    if len(phase.activities) < minimum_activities:
        errors.append(f"CANDIDATE_PHASE_TOO_FEW_ACTIVITIES:{index}")
    if any(
        len(activity.description.strip()) < 60
        for activity in phase.activities
    ):
        errors.append(f"CANDIDATE_ACTIVITY_TOO_GENERIC:{index}")
    if any(
        len(deliverable.description.strip()) < 50
        for deliverable in phase.deliverables
    ):
        errors.append(f"CANDIDATE_DELIVERABLE_TOO_GENERIC:{index}")
    method = phase.assessment.method.strip().casefold()
    if method in {"reviewer rubric", "rubric"}:
        errors.append(f"CANDIDATE_ASSESSMENT_METHOD_GENERIC:{index}")
    criteria = phase.assessment.acceptance_criteria
    if len(criteria) < 2:
        errors.append(f"CANDIDATE_TOO_FEW_ACCEPTANCE_CRITERIA:{index}")
    if any(
        len(criterion.strip()) < 30
        or any(term in criterion.casefold() for term in _GENERIC_CRITERIA)
        for criterion in criteria
    ):
        errors.append(f"CANDIDATE_ACCEPTANCE_CRITERIA_GENERIC:{index}")
    return errors


def _validate_candidate_quality(
    view: CandidateCareerPathView,
    draft: CareerPathDraft,
) -> list[str]:
    errors: list[str] = []
    if len(view.message.strip()) < 160:
        errors.append("CANDIDATE_MESSAGE_TOO_GENERIC")
    if view.summary.strip().casefold() in _GENERIC_SUMMARIES:
        errors.append("CANDIDATE_SUMMARY_NOT_TAILORED")
    if len(view.summary.strip()) < 80:
        errors.append("CANDIDATE_SUMMARY_TOO_SHORT")
    if len(view.next_action.strip()) < 40:
        errors.append("CANDIDATE_NEXT_ACTION_NOT_ACTIONABLE")
    if view.total_duration_weeks != draft.total_duration_weeks:
        errors.append("CANDIDATE_DURATION_MISMATCH")
    if view.hours_per_week != draft.hours_per_week:
        errors.append("CANDIDATE_WEEKLY_HOURS_MISMATCH")
    expected_hours = sum(
        activity.estimated_hours
        for phase in draft.phases
        for activity in phase.activities
    )
    if view.total_estimated_hours != expected_hours:
        errors.append("CANDIDATE_TOTAL_HOURS_MISMATCH")
    if len(view.phases) != len(draft.phases):
        errors.append("CANDIDATE_PHASE_COUNT_MISMATCH")
    for index, phase in enumerate(view.phases, start=1):
        errors.extend(_validate_candidate_phase_quality(phase, index))
    if len(view.checkpoints) < len(view.phases) or any(
        len(checkpoint.strip()) < 30
        or not _WEEK_MILESTONE.search(checkpoint)
        for checkpoint in view.checkpoints
    ):
        errors.append("CANDIDATE_CHECKPOINTS_NOT_ACTIONABLE")
    return errors


def _validate_candidate_view(
    view: CandidateCareerPathView,
    draft: CareerPathDraft,
    gaps: list[CompetencyGap],
    request: CareerPathRequest,
) -> list[str]:
    errors: list[str] = []
    text = _candidate_text(view)
    if any(term in text for term in _FORBIDDEN_TEXT):
        errors.append("CANDIDATE_VIEW_CONTAINS_INTERNAL_OR_PROMISSORY_TEXT")
    if _EMAIL.search(text) or _PHONE.search(text):
        errors.append("CANDIDATE_VIEW_CONTAINS_DIRECT_CONTACT_PII")
    if _HTML_TAG.search(text):
        errors.append("CANDIDATE_VIEW_CONTAINS_HTML")
    if _UNSUPPORTED_REVIEWER.search(text):
        errors.append("CANDIDATE_VIEW_ASSUMES_REVIEWER_AVAILABILITY")
    if _UNSUPPORTED_PERFORMANCE_TARGET.search(text):
        errors.append("CANDIDATE_VIEW_HAS_UNSUPPORTED_PERFORMANCE_TARGET")
    if _UNSUPPORTED_ABSOLUTE_CLAIM.search(text):
        errors.append("CANDIDATE_VIEW_HAS_UNSUPPORTED_ABSOLUTE_CLAIM")
    if _UNSUPPORTED_PRAISE.search(text):
        errors.append("CANDIDATE_VIEW_HAS_UNSUPPORTED_PRAISE")
    if view.language == "vi" and any(
        _ENGLISH_ASSESSMENT_METHOD.search(phase.assessment.method)
        for phase in view.phases
    ):
        errors.append("CANDIDATE_VIEW_LANGUAGE_INCONSISTENT")
    has_not_evidenced = any(
        gap.assessment == GapAssessment.NOT_EVIDENCED for gap in gaps
    )
    if has_not_evidenced and any(term in text for term in _UNSUPPORTED_LACK_TEXT):
        errors.append("UNSUPPORTED_CAPABILITY_CLAIM")
    internal_values = [
        request.application_id,
        request.decision.decision_id,
        request.decision.approved_rationale,
    ]
    if any(value and value.casefold() in text for value in internal_values):
        errors.append("CANDIDATE_VIEW_CONTAINS_INTERNAL_VALUE")
    approved_urls = {resource.url.casefold() for resource in request.approved_resources}
    if any(url not in approved_urls for url in _URL.findall(text)):
        errors.append("CANDIDATE_VIEW_CONTAINS_UNAPPROVED_URL")
    errors.extend(_validate_candidate_quality(view, draft))
    return errors


def validate_roadmap(
    draft: CareerPathDraft,
    gaps: list[CompetencyGap],
    request: CareerPathRequest,
    catalog: ResourceCatalog,
    *,
    candidate_view: CandidateCareerPathView | None = None,
) -> RoadmapValidationResult:
    errors: list[str] = []
    warnings: list[str] = list(draft.warnings)
    gap_by_id = {gap.gap_id: gap for gap in gaps}
    approved_resource_ids = {
        resource.resource_id for resource in request.approved_resources
    }
    critical_ids = {
        gap.gap_id
        for gap in gaps
        if gap.priority in {GapPriority.P0, GapPriority.P1}
    }
    phase_ids = {phase.phase_id for phase in draft.phases}
    if len(phase_ids) != len(draft.phases):
        errors.append("DUPLICATE_PHASE_ID")
    covered_ids = {
        gap_id for phase in draft.phases for gap_id in phase.addressed_gap_ids
    }

    missing_coverage = sorted(critical_ids - covered_ids)
    if missing_coverage:
        errors.append(f"MISSING_CRITICAL_GAP_COVERAGE:{','.join(missing_coverage)}")

    unknown_gaps = sorted(covered_ids - set(gap_by_id))
    if unknown_gaps:
        errors.append(f"UNKNOWN_GAP_REFERENCE:{','.join(unknown_gaps)}")

    for phase in draft.phases:
        errors.extend(
            _validate_phase(
                phase,
                draft=draft,
                gap_by_id=gap_by_id,
                phase_ids=phase_ids,
                approved_resource_ids=approved_resource_ids,
                request=request,
                catalog=catalog,
            )
        )

    if _has_cycle(draft.phases):
        errors.append("DEPENDENCY_CYCLE")

    _, duration_limit, phase_limit = resolve_planning_limits(request)
    actual_duration = sum(phase.duration_weeks for phase in draft.phases)
    if actual_duration != draft.total_duration_weeks:
        errors.append("DURATION_TOTAL_MISMATCH")
    if actual_duration > duration_limit:
        errors.append("DURATION_EXCEEDS_LIMIT")
    if len(draft.phases) > phase_limit:
        errors.append("PHASE_COUNT_EXCEEDS_LIMIT")

    if candidate_view:
        errors.extend(
            _validate_candidate_view(candidate_view, draft, gaps, request)
        )

    metrics = RoadmapValidationMetrics(
        critical_gap_count=len(critical_ids),
        covered_critical_gap_count=len(critical_ids & covered_ids),
        phase_count=len(draft.phases),
        total_duration_weeks=actual_duration,
    )
    return RoadmapValidationResult(
        is_valid=not errors,
        errors=sorted(set(errors)),
        warnings=sorted(set(warnings)),
        metrics=metrics,
    )


def validate_delivery(
    output: CareerPathOutput,
    policy: PlanningPolicy | None = None,
) -> RoadmapValidationResult:
    """Ensure draft/review states cannot accidentally become auto-deliverable."""

    errors: list[str] = []
    if output.delivery_status == DeliveryStatus.ELIGIBLE:
        if policy is None or not policy.allow_candidate_auto_delivery:
            errors.append("AUTO_DELIVERY_NOT_ALLOWED_BY_POLICY")
        if output.status.value != "GENERATED":
            errors.append("ELIGIBLE_OUTPUT_REQUIRES_GENERATED_STATUS")
        if output.candidate_view is None:
            errors.append("ELIGIBLE_OUTPUT_REQUIRES_CANDIDATE_VIEW")
        if output.diagnostics.validation_errors:
            errors.append("ELIGIBLE_OUTPUT_HAS_VALIDATION_ERRORS")
    return RoadmapValidationResult(is_valid=not errors, errors=errors)
