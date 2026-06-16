"""
Read-only issue query helpers for apps.issues.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import Q, QuerySet

from apps.issues.models import Issue
from apps.sprints.selectors import get_active_sprint
from apps.workflow.selectors import select_workflow_config


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
    sprint_is_null: bool = False,
    assignee_id: UUID | None = None,
    status_id: UUID | None = None,
    priority: str | None = None,
    search: str | None = None,
) -> QuerySet[Issue]:
    qs = _optimized_issue_queryset().filter(project_id=project_id)

    if sprint_is_null:
        qs = qs.filter(sprint__isnull=True)
    elif sprint_id is not None:
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


def select_project_kanban_board(project_id: UUID) -> dict:
    workflow = select_workflow_config(project_id)
    issues_by_status_id = {
        status.id: []
        for status in workflow.statuses
    }

    active_sprint = get_active_sprint(project_id)
    issues = get_sprint_issues(active_sprint.id) if active_sprint else Issue.objects.none()

    for issue in issues:
        if issue.status_id in issues_by_status_id:
            issues_by_status_id[issue.status_id].append(issue)

    return {
        "project_id": project_id,
        "columns": [
            {
                "status_id": status.id,
                "status_slug": status.slug,
                "status_name": status.name,
                "issues": issues_by_status_id[status.id],
            }
            for status in workflow.statuses
        ],
    }
