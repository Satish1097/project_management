"""
Read-only sprint query helpers for apps.sprints.
"""
from uuid import UUID

from django.db.models import Case, IntegerField, QuerySet, Value, When

from apps.sprints.models import Sprint, SprintStatus


def _optimized_sprint_queryset() -> QuerySet[Sprint]:
    return Sprint.objects.select_related("project")


def get_project_sprints(project_id: UUID) -> QuerySet[Sprint]:
    return (
        _optimized_sprint_queryset()
        .filter(project_id=project_id)
        .defer("capacity_points")
        .annotate(
            status_rank=Case(
                When(status=SprintStatus.ACTIVE, then=Value(0)),
                When(status=SprintStatus.PLANNED, then=Value(1)),
                When(status=SprintStatus.PAUSED, then=Value(2)),
                When(status=SprintStatus.COMPLETED, then=Value(3)),
                When(status=SprintStatus.CANCELLED, then=Value(3)),
                default=Value(4),
                output_field=IntegerField(),
            )
        )
        .order_by("status_rank", "-created_at")
    )


def get_active_sprint(project_id: UUID) -> Sprint | None:
    return (
        _optimized_sprint_queryset()
        .filter(project_id=project_id, status=SprintStatus.ACTIVE)
        .order_by("-created_at")
        .first()
    )


def get_paused_sprint(project_id: UUID) -> Sprint | None:
    return (
        _optimized_sprint_queryset()
        .filter(project_id=project_id, status=SprintStatus.PAUSED)
        .order_by("-created_at")
        .first()
    )


def get_latest_planned_sprint(project_id: UUID) -> Sprint | None:
    return (
        _optimized_sprint_queryset()
        .filter(project_id=project_id, status=SprintStatus.PLANNED)
        .order_by("-created_at")
        .first()
    )


def get_project_kanban_sprint(project_id: UUID) -> Sprint | None:
    return (
        get_active_sprint(project_id)
        or get_paused_sprint(project_id)
        or get_latest_planned_sprint(project_id)
    )


def get_sprint_by_id(sprint_id: UUID) -> Sprint | None:
    return _optimized_sprint_queryset().filter(pk=sprint_id).first()


def get_project_sprint_by_id(project_id: UUID, sprint_id: UUID) -> Sprint | None:
    return _optimized_sprint_queryset().filter(project_id=project_id, pk=sprint_id).first()
