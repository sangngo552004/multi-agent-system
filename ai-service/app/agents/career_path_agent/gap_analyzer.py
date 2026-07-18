"""Deterministic competency-gap analysis for career-path planning."""

from __future__ import annotations

from collections import defaultdict

from app.core.schemas import (
    CareerPathRequest,
    CompetencyEvidence,
    CompetencyGap,
    DataQualityGrade,
    EvidenceReference,
    EvidenceSource,
    GapAnalysisResult,
    GapAssessment,
)

_NO_EVIDENCE_MARKERS = (
    "no information",
    "not found",
    "not mentioned",
    "không có thông tin",
    "không tìm thấy",
    "chưa đề cập",
)


def _normalize(value: str) -> str:
    return " ".join(value.casefold().split())


def _has_meaningful_evidence(value: str) -> bool:
    normalized = _normalize(value)
    return bool(normalized) and not any(
        marker in normalized for marker in _NO_EVIDENCE_MARKERS
    )


def _is_applicable(request: CareerPathRequest) -> tuple[bool, str | None]:
    decision = request.decision
    if not decision.is_final:
        return False, "DECISION_NOT_FINAL"
    if decision.outcome.value != "REJECTED":
        return False, "DECISION_NOT_REJECTED"
    configured = set(request.policy.applicable_reason_codes)
    if configured and not configured.intersection(decision.reason_codes):
        return False, "REASON_NOT_APPLICABLE"
    return True, None


def _evidence_assessment(
    entries: list[CompetencyEvidence],
) -> tuple[GapAssessment, bool, str]:
    if not entries:
        return GapAssessment.UNKNOWN, True, "No competency evidence was supplied."

    outcomes = {entry.meets_requirement for entry in entries}
    if len(outcomes) > 1:
        return GapAssessment.UNKNOWN, True, "Matcher evidence is conflicting."

    if entries[0].meets_requirement:
        return GapAssessment.MET, False, "Available evidence meets the target."

    confidences = {entry.confidence.upper() for entry in entries}
    if len(confidences) > 1:
        return GapAssessment.UNKNOWN, True, "Matcher confidence is conflicting."
    confidence = next(iter(confidences))
    meaningful = any(_has_meaningful_evidence(entry.evidence) for entry in entries)
    if confidence == "MEDIUM" and meaningful:
        return GapAssessment.PARTIAL, False, "Evidence partially supports the target."
    if confidence == "LOW" and not meaningful:
        return (
            GapAssessment.NOT_EVIDENCED,
            False,
            "The current resume does not provide clear evidence for the target.",
        )
    return GapAssessment.UNKNOWN, True, "Evidence is not conclusive enough to assess."


def _matrix_references(
    entries: list[tuple[int, CompetencyEvidence]],
) -> list[EvidenceReference]:
    return [
        EvidenceReference(
            source=EvidenceSource.MATCHER_EVIDENCE,
            path=f"matching.evidence_matrix[{index}]",
            summary=entry.evidence,
            confidence=entry.confidence.upper(),
        )
        for index, entry in entries
    ]


def _vector_fallback(request: CareerPathRequest, name: str):
    normalized = _normalize(name)
    for index, item in enumerate(request.matching.missing_criteria):
        if _normalize(item.skill) == normalized:
            return (
                GapAssessment.NOT_EVIDENCED,
                item.criticality.upper(),
                EvidenceReference(
                    source=EvidenceSource.VECTOR_MATCH,
                    path=f"matching.missing_criteria[{index}]",
                    summary=item.reason,
                ),
                "Vector matching did not find clear evidence for the target.",
            )
    for index, item in enumerate(request.matching.matched_criteria):
        if _normalize(item.skill) == normalized:
            return (
                GapAssessment.PARTIAL,
                None,
                EvidenceReference(
                    source=EvidenceSource.VECTOR_MATCH,
                    path=f"matching.matched_criteria[{index}]",
                    summary=item.evidence,
                    confidence=str(item.match_score),
                ),
                "Vector matching indicates related evidence but not the target level.",
            )
    return None


def analyze_gaps(request: CareerPathRequest) -> GapAnalysisResult:
    """Build the full competency ledger without inferring an observed level."""

    applicable, reason = _is_applicable(request)
    if not applicable:
        return GapAnalysisResult(
            is_applicable=False,
            applicability_reason=reason,
            data_quality=DataQualityGrade.INSUFFICIENT,
            limitations=[reason] if reason else [],
        )

    limitations: list[str] = []
    review_required = False
    quality = DataQualityGrade.SUFFICIENT
    if (
        request.candidate.status.value == "failed"
        or request.matching.status.upper() == "ERROR"
    ):
        return GapAnalysisResult(
            is_applicable=True,
            data_quality=DataQualityGrade.INSUFFICIENT,
            limitations=["UPSTREAM_PROCESSING_FAILED"],
            requires_human_review=True,
        )
    if request.candidate.status.value == "partial":
        quality = DataQualityGrade.LIMITED
        limitations.append("CV_EXTRACTION_PARTIAL")
        review_required = True

    evidence_by_id: dict[str, list[tuple[int, CompetencyEvidence]]] = defaultdict(list)
    for index, entry in enumerate(request.matching.evidence_matrix):
        evidence_by_id[entry.competency_id].append((index, entry))

    related_ids = set(request.decision.related_competency_ids)
    job_ids = {
        target.competency_id for target in request.job.required_competencies
    }
    unknown_related_ids = sorted(related_ids - job_ids)
    if unknown_related_ids:
        limitations.append("DECISION_REFERENCES_UNKNOWN_COMPETENCY")
        quality = DataQualityGrade.INSUFFICIENT
        review_required = True

    gaps: list[CompetencyGap] = []
    for target in request.job.required_competencies:
        if target.category.upper() == "PEDIGREE":
            continue

        entries_with_index = evidence_by_id.get(target.competency_id, [])
        entries = [entry for _, entry in entries_with_index]
        assessment, item_review, rationale = _evidence_assessment(entries)
        references = _matrix_references(entries_with_index)
        criticality = None

        if not entries and target.category.upper() == "HARD_SKILL":
            fallback = _vector_fallback(request, target.name)
            if fallback:
                assessment, criticality, reference, rationale = fallback
                references = [reference]
                item_review = True
                quality = DataQualityGrade.LIMITED
                limitations.append("VECTOR_FALLBACK_USED")

        if not entries and not references:
            limitations.append(f"MISSING_COMPETENCY_EVIDENCE:{target.competency_id}")
            if target.is_mandatory or target.competency_id in related_ids:
                quality = DataQualityGrade.INSUFFICIENT
            elif quality == DataQualityGrade.SUFFICIENT:
                quality = DataQualityGrade.LIMITED

        if not target.required_level_description:
            item_review = True
            limitations.append(
                f"MISSING_LEVEL_DESCRIPTION:{target.competency_id}"
            )
            if target.is_mandatory or target.competency_id in related_ids:
                quality = DataQualityGrade.INSUFFICIENT
            elif quality == DataQualityGrade.SUFFICIENT:
                quality = DataQualityGrade.LIMITED

        reason_codes = (
            list(request.decision.reason_codes)
            if not related_ids or target.competency_id in related_ids
            else []
        )
        gap = CompetencyGap(
            gap_id=f"gap:{target.competency_id}",
            competency_id=target.competency_id,
            competency_name=target.name,
            category=target.category.upper(),
            target_level=target.required_level,
            target_level_description=target.required_level_description,
            assessment=assessment,
            is_mandatory=target.is_mandatory,
            weight=target.weight,
            criticality=criticality,
            reason_codes=reason_codes,
            evidence_references=references,
            rationale=rationale,
            requires_human_review=item_review,
        )
        gaps.append(gap)
        review_required = review_required or item_review

    gaps.sort(key=lambda item: item.competency_id)
    strengths = [item for item in gaps if item.assessment == GapAssessment.MET]
    roadmap_gaps = [item for item in gaps if item.assessment != GapAssessment.MET]
    return GapAnalysisResult(
        is_applicable=True,
        all_gaps=gaps,
        roadmap_gaps=roadmap_gaps,
        strengths=strengths,
        data_quality=quality,
        limitations=sorted(set(limitations)),
        requires_human_review=review_required,
    )
