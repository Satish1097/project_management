"""
Read-only issue query helpers for apps.issues.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import Q, QuerySet

from apps.issues.models import Issue, IssueActivity, IssueAttachment, IssueComment
from apps.sprints.selectors import get_project_kanban_sprint
from apps.workflow.selectors import get_project_statuses
from apps.workflow.slug_utils import status_slug


def _optimized_issue_queryset() -> QuerySet[Issue]:
    return Issue.objects.select_related(
        "project",
        "sprint",
        "status",
        "assignee",
        "reporter",
    ).prefetch_related("labels")


def _optimized_comment_queryset() -> QuerySet[IssueComment]:
    return IssueComment.objects.select_related("author")


def _optimized_activity_queryset() -> QuerySet[IssueActivity]:
    return IssueActivity.objects.select_related("actor")


def _optimized_attachment_queryset() -> QuerySet[IssueAttachment]:
    return IssueAttachment.objects.select_related("uploaded_by")


def get_issue_by_id(issue_id: UUID) -> Issue | None:
    return _optimized_issue_queryset().filter(pk=issue_id).first()


def get_comment_by_id(comment_id: UUID) -> IssueComment | None:
    return _optimized_comment_queryset().filter(pk=comment_id).first()


def get_activity_by_id(activity_id: UUID) -> IssueActivity | None:
    return _optimized_activity_queryset().filter(pk=activity_id).first()


def get_attachment_by_id(attachment_id: UUID) -> IssueAttachment | None:
    return _optimized_attachment_queryset().filter(pk=attachment_id).first()


def get_issue_comments(issue_id: UUID) -> QuerySet[IssueComment]:
    return _optimized_comment_queryset().filter(issue_id=issue_id).order_by("created_at")


def get_issue_attachments(issue_id: UUID) -> QuerySet[IssueAttachment]:
    return _optimized_attachment_queryset().filter(issue_id=issue_id).order_by("created_at")


def get_issue_activity(issue_id: UUID) -> QuerySet[IssueActivity]:
    return _optimized_activity_queryset().filter(issue_id=issue_id).order_by("-created_at")


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
    return _optimized_issue_queryset().filter(sprint_id=sprint_id).order_by("-created_at")


def get_backlog_issues(project_id: UUID) -> QuerySet[Issue]:
    return _optimized_issue_queryset().filter(
        project_id=project_id,
        sprint__isnull=True,
    )


def get_project_kanban(project_id: UUID) -> dict:
    statuses = list(get_project_statuses(project_id))
    issues_by_status_id = {
        status.id: []
        for status in statuses
    }

    sprint = get_project_kanban_sprint(project_id)
    issues = get_sprint_issues(sprint.id) if sprint is not None else Issue.objects.none()

    for issue in issues:
        if issue.status_id in issues_by_status_id:
            issues_by_status_id[issue.status_id].append(issue)

    return {
        "sprint": sprint,
        "columns": [
            {
                "status": status,
                "issues": issues_by_status_id[status.id],
            }
            for status in statuses
        ],
    }


def select_project_kanban_board(project_id: UUID) -> dict:
    board = get_project_kanban(project_id)
    return {
        "project_id": project_id,
        "columns": [
            {
                "status_id": column["status"].id,
                "status_slug": status_slug(
                    name=column["status"].name,
                    category=column["status"].category,
                ),
                "status_name": column["status"].name,
                "issues": column["issues"],
            }
            for column in board["columns"]
        ],
    }
