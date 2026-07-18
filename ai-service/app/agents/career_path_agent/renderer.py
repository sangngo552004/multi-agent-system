"""Allowlisted candidate-facing rendering with cautious evidence language."""

from __future__ import annotations

from app.agents.career_path_agent.resource_catalog import ResourceCatalog
from app.core.schemas import (
    CandidateCareerPathView,
    CandidateLearningResource,
    CandidateRoadmapActivity,
    CandidateRoadmapAssessment,
    CandidateRoadmapDeliverable,
    CandidateRoadmapPhase,
    CareerPathDraft,
    CareerPathRequest,
    CompetencyGap,
    GapAssessment,
)


def _growth_area(gap: CompetencyGap, language: str) -> str:
    if gap.assessment == GapAssessment.NOT_EVIDENCED:
        return (
            f"Hồ sơ hiện chưa thể hiện rõ minh chứng cho {gap.competency_name}; nên xác nhận bằng bài đánh giá hoặc sản phẩm thực hành."
            if language == "vi"
            else f"The current resume does not clearly evidence {gap.competency_name}; confirm it through an assessment or practical artifact."
        )
    if gap.assessment == GapAssessment.UNKNOWN:
        return (
            f"Chưa đủ dữ liệu để đánh giá {gap.competency_name}; cần đánh giá điểm xuất phát trước."
            if language == "vi"
            else f"There is not enough information to assess {gap.competency_name}; assess the starting point first."
        )
    return (
        f"Tiếp tục xây dựng minh chứng cho {gap.competency_name} theo mục tiêu: {gap.target_level_description}"
        if language == "vi"
        else f"Continue building evidence for {gap.competency_name} against this target: {gap.target_level_description}"
    )


def render_candidate_view(
    draft: CareerPathDraft,
    gaps: list[CompetencyGap],
    request: CareerPathRequest,
    catalog: ResourceCatalog,
) -> CandidateCareerPathView:
    """Render only schema-allowlisted data; this does not grant delivery eligibility."""

    language = request.constraints.preferred_language
    strengths = [
        (
            f"Hồ sơ có minh chứng phù hợp cho {gap.competency_name}."
            if language == "vi"
            else f"The resume provides relevant evidence for {gap.competency_name}."
        )
        for gap in gaps
        if gap.assessment == GapAssessment.MET
    ]
    growth_areas = [
        _growth_area(gap, language)
        for gap in gaps
        if gap.assessment != GapAssessment.MET
    ]
    resource_ids = {
        resource_id for phase in draft.phases for resource_id in phase.resource_ids
    }
    def render_resources(ids: set[str]) -> list[CandidateLearningResource]:
        rendered: list[CandidateLearningResource] = []
        for resource_id in sorted(ids):
            resource = catalog.get(resource_id)
            if resource:
                rendered.append(
                    CandidateLearningResource(
                        title=resource.title,
                        provider=resource.provider,
                        url=resource.url,
                        format=resource.format,
                        language=resource.language,
                    )
                )
        return rendered

    resources = render_resources(resource_ids)
    candidate_phases: list[CandidateRoadmapPhase] = []
    phase_week_start = 1
    for phase in draft.phases:
        phase_week_end = phase_week_start + phase.duration_weeks - 1
        phase_resources = render_resources(set(phase.resource_ids))
        candidate_phases.append(
            CandidateRoadmapPhase(
                title=phase.title,
                week_start=phase_week_start,
                week_end=phase_week_end,
                duration_weeks=phase.duration_weeks,
                estimated_hours=sum(
                    activity.estimated_hours for activity in phase.activities
                ),
                activities=[
                    CandidateRoadmapActivity(
                        title=activity.title,
                        description=activity.description,
                        week_start=(
                            phase_week_start + activity.week_start - 1
                        ),
                        week_end=phase_week_start + activity.week_end - 1,
                        estimated_hours=activity.estimated_hours,
                    )
                    for activity in phase.activities
                ],
                deliverables=[
                    CandidateRoadmapDeliverable(
                        title=deliverable.title,
                        description=deliverable.description,
                    )
                    for deliverable in phase.deliverables
                ],
                assessment=CandidateRoadmapAssessment(
                    method=phase.assessment.method,
                    acceptance_criteria=list(
                        phase.assessment.acceptance_criteria
                    ),
                ),
                resources=phase_resources,
            )
        )
        phase_week_start = phase_week_end + 1

    first_activity = candidate_phases[0].activities[0]
    next_action = (
        f"Bắt đầu ở tuần {first_activity.week_start}: {first_activity.title}. {first_activity.description}"
        if language == "vi"
        else f"Start in week {first_activity.week_start}: {first_activity.title}. {first_activity.description}"
    )

    target_role = request.job.title or (
        f"{request.job.job_family} - {request.job.career_level}"
    )
    disclaimer = (
        "Lộ trình là gợi ý phát triển dựa trên thông tin hiện có và không bảo đảm kết quả tuyển dụng."
        if language == "vi"
        else "This roadmap is a development suggestion based on available information and does not guarantee a hiring outcome."
    )
    return CandidateCareerPathView(
        message=draft.candidate_message,
        target_role=target_role,
        summary=draft.summary,
        total_duration_weeks=draft.total_duration_weeks,
        hours_per_week=draft.hours_per_week,
        total_estimated_hours=sum(
            activity.estimated_hours
            for phase in draft.phases
            for activity in phase.activities
        ),
        demonstrated_strengths=strengths,
        priority_growth_areas=growth_areas,
        phases=candidate_phases,
        checkpoints=list(draft.checkpoints),
        resources=resources,
        next_action=next_action,
        limitations=[disclaimer],
        language=language,
    )
