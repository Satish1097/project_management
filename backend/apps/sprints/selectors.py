"""
Read-only sprint query helpers for apps.sprints.
"""
from uuid import UUID

from django.db.models import Case, Count, IntegerField, Q, QuerySet, Sum, Value, When
from django.db.models.functions import Coalesce

from apps.permissions.services import permission_service
from apps.sprints.models import Sprint, SprintStatus
from apps.workflow.models import WorkflowStatusCategory


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


def _sprint_health_queryset() -> QuerySet[Sprint]:
    return _optimized_sprint_queryset().annotate(
        committed_story_points=Coalesce(
            Sum("issues__story_points"),
            Value(0),
            output_field=IntegerField(),
        ),
        completed_story_points=Coalesce(
            Sum(
                "issues__story_points",
                filter=Q(issues__status__category=WorkflowStatusCategory.DONE),
            ),
            Value(0),
            output_field=IntegerField(),
        ),
        remaining_story_points=Coalesce(
            Sum(
                "issues__story_points",
                filter=~Q(issues__status__category=WorkflowStatusCategory.DONE),
            ),
            Value(0),
            output_field=IntegerField(),
        ),
        issue_count=Count("issues"),
        completed_issue_count=Count(
            "issues",
            filter=Q(issues__status__category=WorkflowStatusCategory.DONE),
        ),
    )


def _sprint_health_to_dict(sprint: Sprint) -> dict:
    return {
        "sprint_id": sprint.id,
        "sprint_name": sprint.name,
        "sprint_status": sprint.status,
        "start_date": sprint.start_date,
        "end_date": sprint.end_date,
        "capacity_points": sprint.capacity_points,
        "committed_story_points": sprint.committed_story_points,
        "completed_story_points": sprint.completed_story_points,
        "remaining_story_points": sprint.remaining_story_points,
        "issue_count": sprint.issue_count,
        "completed_issue_count": sprint.completed_issue_count,
    }


def select_sprint_health(
    user_id: UUID,
    project_id: UUID,
    sprint_id: UUID,
) -> dict | None:
    if not permission_service.can_view_project(user_id, project_id):
        return None

    sprint = (
        _sprint_health_queryset()
        .filter(project_id=project_id, pk=sprint_id)
        .only(
            "id",
            "project_id",
            "name",
            "status",
            "start_date",
            "end_date",
            "capacity_points",
        )
        .first()
    )
    if sprint is None:
        return None

    return _sprint_health_to_dict(sprint)


def select_active_sprint_health(user_id: UUID, project_id: UUID) -> dict | None:
    if not permission_service.can_view_project(user_id, project_id):
        return None

    sprint = (
        _sprint_health_queryset()
        .filter(project_id=project_id, status=SprintStatus.ACTIVE)
        .only(
            "id",
            "project_id",
            "name",
            "status",
            "start_date",
            "end_date",
            "capacity_points",
        )
        .order_by("-created_at")
        .first()
    )
    if sprint is None:
        return None

    return _sprint_health_to_dict(sprint)


def select_project_sprint_health(user_id: UUID, project_id: UUID) -> list[dict] | None:
    if not permission_service.can_view_project(user_id, project_id):
        return None

    sprints = (
        _sprint_health_queryset()
        .filter(project_id=project_id)
        .only(
            "id",
            "project_id",
            "name",
            "status",
            "start_date",
            "end_date",
            "capacity_points",
        )
        .order_by("-created_at")
    )
    return [_sprint_health_to_dict(sprint) for sprint in sprints]


def get_project_sprints_with_health(project_id: UUID) -> QuerySet[Sprint]:
    """Returns sprints with issue count and completed count annotations."""
    return (
        _sprint_health_queryset()
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
