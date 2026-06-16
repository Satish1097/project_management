"""
Read-only issue query helpers for apps.issues.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import Q, QuerySet

from apps.issues.models import Issue


def _optimized_issue_queryset() -> QuerySet[Issue]:
    return Issue.objects.select_related(
        "project",
        "sprint",
        "status",
        "assignee",
        "reporter",
    ).prefetch_related("labels")


def get_issue_by_id(issue_id: UUID) -> Issue | None:
    return _optimized_issue_queryset().filter(pk=issue_id).first()


def get_project_issue_by_id(project_id: UUID, issue_id: UUID) -> Issue | None:
    return (
        _optimized_issue_queryset()
        .filter(project_id=project_id, pk=issue_id)
        .first()
    )


def get_project_issues(
    project_id: UUID,
    *,
    sprint_id: UUID | None = None,
    assignee_id: UUID | None = None,
    status_id: UUID | None = None,
    priority: str | None = None,
    search: str | None = None,
) -> QuerySet[Issue]:
    qs = _optimized_issue_queryset().filter(project_id=project_id)

    if sprint_id is not None:
        qs = qs.filter(sprint_id=sprint_id)
    if assignee_id is not None:
        qs = qs.filter(assignee_id=assignee_id)
    if status_id is not None:
        qs = qs.filter(status_id=status_id)
    if priority is not None:
        qs = qs.filter(priority=priority)
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(key__icontains=search))

    return qs.order_by("-created_at")


def get_sprint_issues(sprint_id: UUID) -> QuerySet[Issue]:
    return _optimized_issue_queryset().filter(sprint_id=sprint_id)


def get_backlog_issues(project_id: UUID) -> QuerySet[Issue]:
    return _optimized_issue_queryset().filter(
        project_id=project_id,
        sprint__isnull=True,
    )
