"""Read-only lookup over resources approved by the request owner."""

from __future__ import annotations

from datetime import datetime, timezone

from app.core.schemas import (
    ApprovedLearningResource,
    CandidateConstraints,
    CompetencyGap,
    PlanningPolicy,
)

_COST_ORDER = {"FREE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3}


class ResourceCatalog:
    """Index and filter an immutable, request-scoped approved catalog."""

    def __init__(self, resources: list[ApprovedLearningResource]) -> None:
        ids = [resource.resource_id for resource in resources]
        if len(ids) != len(set(ids)):
            raise ValueError("approved resource IDs must be unique")
        self._resources = {
            resource.resource_id: resource.model_copy(deep=True)
            for resource in resources
        }

    def get(self, resource_id: str) -> ApprovedLearningResource | None:
        resource = self._resources.get(resource_id)
        return resource.model_copy(deep=True) if resource else None

    def is_fresh(
        self,
        resource: ApprovedLearningResource,
        policy: PlanningPolicy,
        *,
        now: datetime | None = None,
    ) -> bool:
        current = now or datetime.now(timezone.utc)
        verified = resource.last_verified_at
        if verified.tzinfo is None:
            verified = verified.replace(tzinfo=timezone.utc)
        age_days = (current - verified).days
        return 0 <= age_days <= policy.resource_max_age_days

    def is_compatible(
        self,
        resource: ApprovedLearningResource,
        gap: CompetencyGap,
        constraints: CandidateConstraints,
        policy: PlanningPolicy,
        *,
        now: datetime | None = None,
    ) -> bool:
        max_cost = (
            _COST_ORDER[constraints.max_budget]
            if constraints.max_budget
            else None
        )
        preferred_formats = {
            item.casefold() for item in constraints.preferred_formats
        }
        resource_cost = _COST_ORDER[resource.cost_tier]
        return (
            gap.competency_id in resource.competency_ids
            and resource.min_level <= gap.target_level <= resource.max_level
            and resource.language == constraints.preferred_language
            and (
                not preferred_formats
                or resource.format.casefold() in preferred_formats
            )
            and (max_cost is None or resource_cost <= max_cost)
            and self.is_fresh(resource, policy, now=now)
        )

    def select_for_gap(
        self,
        gap: CompetencyGap,
        constraints: CandidateConstraints,
        policy: PlanningPolicy,
        *,
        limit: int = 2,
        now: datetime | None = None,
    ) -> list[ApprovedLearningResource]:
        """Return a stable list satisfying competency, level and user constraints."""

        selected: list[ApprovedLearningResource] = []
        for resource in self._resources.values():
            if not self.is_compatible(
                resource, gap, constraints, policy, now=now
            ):
                continue
            selected.append(resource.model_copy(deep=True))

        selected.sort(key=lambda item: (item.estimated_hours, item.resource_id))
        return selected[:limit]

    @property
    def resource_ids(self) -> set[str]:
        return set(self._resources)
