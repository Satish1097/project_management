"""
Read-only sprint lookups and projections for apps.sprints.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import Case, IntegerField, Value, When

from apps.contracts.sprint_contract import SprintDetailDTO, SprintSummaryDTO
from apps.sprints.models import Sprint, SprintStatus


def _sprint_to_summary_dto(sprint: Sprint) -> SprintSummaryDTO:
    return SprintSummaryDTO(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        status=sprint.status,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
    )


def _sprint_to_detail_dto(sprint: Sprint) -> SprintDetailDTO:
    return SprintDetailDTO(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        status=sprint.status,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        goal=sprint.goal,
        started_at=sprint.started_at,
        completed_at=sprint.completed_at,
    )


def select_active_sprint(project_id: UUID) -> SprintSummaryDTO | None:
    sprint = (
        Sprint.objects.filter(project_id=project_id, status=SprintStatus.ACTIVE)
        .order_by("-created_at")
        .first()
    )
    if sprint is None:
        return None
    return _sprint_to_summary_dto(sprint)


def select_sprint_by_id(sprint_id: UUID) -> SprintDetailDTO | None:
    try:
        sprint = Sprint.objects.get(pk=sprint_id)
    except Sprint.DoesNotExist:
        return None
    return _sprint_to_detail_dto(sprint)


def select_sprint_summary(sprint_id: UUID) -> SprintSummaryDTO | None:
    try:
        sprint = Sprint.objects.get(pk=sprint_id)
    except Sprint.DoesNotExist:
        return None
    return _sprint_to_summary_dto(sprint)


def select_sprints_for_project(project_id: UUID) -> list[SprintSummaryDTO]:
    sprints = (
        Sprint.objects.filter(project_id=project_id)
        .annotate(
            status_rank=Case(
                When(status=SprintStatus.ACTIVE, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        )
        .order_by("status_rank", "-created_at")
    )
    return [_sprint_to_summary_dto(sprint) for sprint in sprints]
