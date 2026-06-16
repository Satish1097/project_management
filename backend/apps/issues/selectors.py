"""
Read-only issue lookups and projections for apps.issues.

Selectors must not mutate data or contain business logic.
"""
from collections import defaultdict
from uuid import UUID

from django.utils.text import slugify

from apps.contracts.issue_contract import (
    IssueBoardColumnDTO,
    IssueDetailDTO,
    IssueKanbanDTO,
    IssueSummaryDTO,
)
from apps.issues.models import Issue
from apps.workflow.models import WorkflowStatus


def _status_slug(status: WorkflowStatus) -> str:
    # Temporary compatibility for Phase 6 workflow schema (slug removed).
    category = getattr(status, "category", None)
    if category in {"todo", "in_progress", "done"}:
        return category
    return getattr(status, "slug", slugify(status.name).replace("-", "_"))


def _issue_to_summary_dto(issue: Issue) -> IssueSummaryDTO:
    return IssueSummaryDTO(
        id=issue.id,
        project_id=issue.project_id,
        key=issue.key,
        title=issue.title,
        issue_type=issue.issue_type,
        priority=issue.priority,
        status_slug=_status_slug(issue.status),
        position=issue.position,
        assignee_id=issue.assignee_id,
        sprint_id=issue.sprint_id,
    )


def _issue_to_detail_dto(issue: Issue) -> IssueDetailDTO:
    story_points = (
        int(issue.story_points) if issue.story_points is not None else None
    )
    return IssueDetailDTO(
        id=issue.id,
        project_id=issue.project_id,
        key=issue.key,
        title=issue.title,
        issue_type=issue.issue_type,
        priority=issue.priority,
        status_slug=_status_slug(issue.status),
        position=issue.position,
        assignee_id=issue.assignee_id,
        sprint_id=issue.sprint_id,
        description=issue.description,
        reporter_id=issue.reporter_id,
        created_at=issue.created_at,
        updated_at=issue.updated_at,
        story_points=story_points,
        due_date=issue.due_date,
        labels=list(issue.labels or []),
        parent_issue_id=issue.parent_issue_id,
    )


def select_issue_by_id(issue_id: UUID) -> IssueDetailDTO | None:
    try:
        issue = Issue.objects.select_related("status").get(pk=issue_id)
    except Issue.DoesNotExist:
        return None
    return _issue_to_detail_dto(issue)


def select_issues_for_project(project_id: UUID) -> list[IssueSummaryDTO]:
    issues = (
        Issue.objects.filter(project_id=project_id)
        .select_related("status")
        .order_by("-created_at")
    )
    return [_issue_to_summary_dto(issue) for issue in issues]


def select_backlog_issues(project_id: UUID) -> list[IssueSummaryDTO]:
    issues = (
        Issue.objects.filter(project_id=project_id, sprint__isnull=True)
        .select_related("status")
        .order_by("status__order", "position")
    )
    return [_issue_to_summary_dto(issue) for issue in issues]


def select_sprint_issues(sprint_id: UUID) -> list[IssueSummaryDTO]:
    issues = (
        Issue.objects.filter(sprint_id=sprint_id)
        .select_related("status")
        .order_by("status__order", "position")
    )
    return [_issue_to_summary_dto(issue) for issue in issues]


def select_kanban_board(
    project_id: UUID,
    sprint_id: UUID | None = None,
) -> IssueKanbanDTO:
    statuses = WorkflowStatus.objects.filter(project_id=project_id).order_by("order")

    issues_qs = Issue.objects.filter(project_id=project_id).select_related("status")
    if sprint_id is not None:
        issues_qs = issues_qs.filter(sprint_id=sprint_id)
    else:
        issues_qs = issues_qs.filter(sprint__isnull=True)
    issues_qs = issues_qs.order_by("position")

    issues_by_status: dict[UUID, list[IssueSummaryDTO]] = defaultdict(list)
    for issue in issues_qs:
        issues_by_status[issue.status_id].append(_issue_to_summary_dto(issue))

    columns = [
        IssueBoardColumnDTO(
            status_slug=_status_slug(status),
            status_name=status.name,
            issues=issues_by_status.get(status.id, []),
        )
        for status in statuses
    ]
    return IssueKanbanDTO(project_id=project_id, columns=columns)
