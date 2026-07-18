"""Transparent deterministic prioritization for competency gaps."""

from __future__ import annotations

from app.core.schemas import (
    CareerPathRequest,
    CompetencyGap,
    GapActionMode,
    GapAnalysisResult,
    GapAssessment,
    GapPriority,
)

_PRIORITY_ORDER = {GapPriority.P0: 0, GapPriority.P1: 1, GapPriority.P2: 2}


def _action_mode(gap: CompetencyGap) -> GapActionMode:
    category = gap.category.upper()
    if gap.assessment == GapAssessment.UNKNOWN:
        return GapActionMode.ASSESS_FIRST
    if category == "SOFT_SKILL" and gap.assessment == GapAssessment.NOT_EVIDENCED:
        return GapActionMode.ASSESS_FIRST
    if category == "EXPERIENCE":
        return GapActionMode.BUILD_EVIDENCE
    if gap.assessment == GapAssessment.NOT_EVIDENCED:
        return GapActionMode.BUILD_EVIDENCE
    if gap.assessment == GapAssessment.PARTIAL:
        return GapActionMode.PRACTICE
    return GapActionMode.PRACTICE


def prioritize_gaps(
    analysis: GapAnalysisResult,
    request: CareerPathRequest,
) -> GapAnalysisResult:
    """Assign P0/P1/P2 and an action mode without an opaque score formula."""

    related_ids = set(request.decision.related_competency_ids)
    candidates = [gap.model_copy(deep=True) for gap in analysis.roadmap_gaps]
    has_explicit_p1 = any(
        gap.competency_id in related_ids or (gap.criticality or "").upper() == "HIGH"
        for gap in candidates
        if not gap.is_mandatory
    )

    fallback_p1_ids: set[str] = set()
    if not has_explicit_p1:
        optional = sorted(
            (gap for gap in candidates if not gap.is_mandatory),
            key=lambda item: (-item.weight, item.competency_id),
        )
        fallback_p1_ids = {
            gap.competency_id for gap in optional[: request.policy.core_gap_count]
        }

    for gap in candidates:
        if gap.is_mandatory:
            gap.priority = GapPriority.P0
        elif (
            gap.competency_id in related_ids
            or (gap.criticality or "").upper() == "HIGH"
            or gap.competency_id in fallback_p1_ids
        ):
            gap.priority = GapPriority.P1
        else:
            gap.priority = GapPriority.P2
        gap.action_mode = _action_mode(gap)

    candidates.sort(
        key=lambda item: (
            _PRIORITY_ORDER[item.priority],
            -item.weight,
            item.competency_id,
        )
    )
    by_id = {gap.competency_id: gap for gap in candidates}
    all_gaps = [
        by_id.get(gap.competency_id, gap.model_copy(deep=True))
        for gap in analysis.all_gaps
    ]
    return analysis.model_copy(
        update={"roadmap_gaps": candidates, "all_gaps": all_gaps},
        deep=True,
    )
