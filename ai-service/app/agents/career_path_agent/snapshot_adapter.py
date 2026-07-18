"""Allowlisted adapters for the Career Path trust boundary."""

from __future__ import annotations

from app.core.schemas import (
    CareerPathCandidateSnapshot,
    CareerPathCompetencyTarget,
    CareerPathJobSnapshot,
    CareerPathMatchingSnapshot,
    CVExtractionResponse,
    JobConfiguration,
    MatchingOutput,
)


def build_candidate_snapshot(
    cv: CVExtractionResponse,
    *,
    snapshot_version: str = "1.0",
) -> CareerPathCandidateSnapshot:
    """Copy only resume facts needed for planning and discard direct-contact PII."""

    return CareerPathCandidateSnapshot(
        status=cv.status,
        extraction_method=cv.extraction_method,
        language_detected=cv.language_detected,
        skills=list(cv.skills),
        experience=[item.model_copy(deep=True) for item in cv.experience],
        education=[item.model_copy(deep=True) for item in cv.education],
        certifications=list(cv.certifications),
        confidence_scores=cv.confidence_scores.model_copy(deep=True),
        warnings=list(cv.warnings),
        snapshot_version=snapshot_version,
    )


def build_matching_snapshot(
    matching: MatchingOutput,
    *,
    snapshot_version: str = "1.0",
) -> CareerPathMatchingSnapshot:
    """Copy evidence fields while excluding scores, HR text, and pedigree rules."""

    return CareerPathMatchingSnapshot(
        status=matching.status,
        evidence_matrix=[item.model_copy(deep=True) for item in matching.evidence_matrix],
        matched_criteria=[
            item.model_copy(deep=True) for item in matching.matched_criteria
        ],
        missing_criteria=[
            item.model_copy(deep=True) for item in matching.missing_criteria
        ],
        snapshot_version=snapshot_version,
    )


def build_job_snapshot(
    job: JobConfiguration,
    level_descriptions: dict[str, str],
    *,
    title: str | None = None,
    snapshot_version: str = "1.0",
    data_version: str = "1.0",
) -> CareerPathJobSnapshot:
    """Freeze competency targets with semantic required-level descriptions."""

    targets = [
        CareerPathCompetencyTarget(
            competency_id=item.competency_id,
            name=item.name,
            category=item.category,
            weight=item.weight,
            required_level=item.required_level,
            required_level_description=level_descriptions.get(item.competency_id),
            is_mandatory=item.is_mandatory,
            data_version=data_version,
        )
        for item in job.required_competencies
    ]
    return CareerPathJobSnapshot(
        job_id=job.job_id,
        job_family=job.job_family,
        career_level=job.career_level,
        title=title,
        required_competencies=targets,
        snapshot_version=snapshot_version,
    )
