"""
Issue module contract — DTOs and narrow read/write interfaces.

Read methods delegate to apps.issues selectors (Phase 3 Slice 6).
Write methods implemented in later slices.
"""
from dataclasses import dataclass, field
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID


@dataclass(frozen=True)
class IssueSummaryDTO:
    id: UUID
    project_id: UUID
    key: str
    title: str
    issue_type: str
    priority: str
    status_slug: str
    position: Decimal
    assignee_id: Optional[UUID] = None
    sprint_id: Optional[UUID] = None


@dataclass(frozen=True, kw_only=True)
class IssueDetailDTO(IssueSummaryDTO):
    description: str
    reporter_id: UUID
    created_at: datetime
    updated_at: datetime
    story_points: Optional[int] = None
    due_date: Optional[date] = None
    labels: list[str] = field(default_factory=list)
    parent_issue_id: Optional[UUID] = None


@dataclass(frozen=True)
class IssueBoardColumnDTO:
    status_slug: str
    status_name: str
    issues: list[IssueSummaryDTO] = field(default_factory=list)


@dataclass(frozen=True)
class BoardScopeDTO:
    methodology: str
    has_active_sprint: bool
    selected_sprint_id: Optional[UUID] = None


@dataclass(frozen=True)
class IssueKanbanDTO:
    project_id: UUID
    columns: list[IssueBoardColumnDTO] = field(default_factory=list)
    scope: Optional[BoardScopeDTO] = None


def get_issue_by_id(issue_id: UUID) -> Optional[IssueDetailDTO]:
    from apps.issues.selectors import select_issue_by_id

    return select_issue_by_id(issue_id)


def get_issues_for_project(project_id: UUID) -> list[IssueSummaryDTO]:
    from apps.issues.selectors import select_issues_for_project

    return select_issues_for_project(project_id)


def get_backlog_issues(project_id: UUID) -> list[IssueSummaryDTO]:
    from apps.issues.selectors import select_backlog_issues

    return select_backlog_issues(project_id)


def get_kanban_board(
    project_id: UUID,
    sprint_id: Optional[UUID] = None,
    *,
    selected_sprint_id: Optional[UUID] = None,
) -> IssueKanbanDTO:
    from apps.issues.selectors import get_project_kanban, get_sprint_kanban, resolve_board_scope
    from apps.projects.models import ProjectMethodology
    from apps.workflow.slug_utils import status_slug

    scope_dto: Optional[BoardScopeDTO] = None

    if sprint_id is not None:
        board = get_sprint_kanban(sprint_id)
        if board is None:
            return IssueKanbanDTO(project_id=project_id, columns=[])
        project_id = board["sprint"].project_id
    else:
        scope = resolve_board_scope(project_id, selected_sprint_id)
        scope_dto = BoardScopeDTO(
            methodology=scope.methodology,
            has_active_sprint=(
                scope.methodology == ProjectMethodology.KANBAN or not scope.is_empty
            ),
            selected_sprint_id=scope.sprint_id,
        )
        board = get_project_kanban(project_id, selected_sprint_id=selected_sprint_id)

    columns: list[IssueBoardColumnDTO] = []
    for column in board["columns"]:
        status = column["status"]
        slug = status_slug(name=status.name, category=status.category)
        issues = [
            IssueSummaryDTO(
                id=issue.id,
                project_id=issue.project_id,
                key=issue.key,
                title=issue.title,
                issue_type=issue.type,
                priority=issue.priority,
                status_slug=slug,
                position=issue.position,
                assignee_id=issue.get_primary_assignee_id(),
                sprint_id=issue.sprint_id,
            )
            for issue in column["issues"]
        ]
        columns.append(
            IssueBoardColumnDTO(
                status_slug=slug,
                status_name=status.name,
                issues=issues,
            )
        )

    return IssueKanbanDTO(project_id=project_id, columns=columns, scope=scope_dto)


def get_sprint_issues(sprint_id: UUID) -> list[IssueSummaryDTO]:
    from apps.issues.selectors import select_sprint_issues

    return select_sprint_issues(sprint_id)


def apply_status_change(
    issue_id: UUID,
    to_status_slug: str,
    actor_id: UUID,
) -> None:
    """
    Apply a workflow status change to an issue.

    Delegates to workflow.TransitionService via lazy import — no ORM in this
    module. Called by the transition API facade and by issue_service.
    """
    from apps.issues.exceptions import IssueNotFoundError
    from apps.issues.models import Issue
    from apps.workflow.services.transition_service import (
        transition_service as _ts,
    )

    try:
        issue = Issue.objects.select_related("status").get(pk=issue_id)
    except Issue.DoesNotExist:
        raise IssueNotFoundError(f"Issue '{issue_id}' not found.")

    _ts.transition_issue(issue, to_status_slug, actor_id)


def bulk_set_sprint(
    issue_ids: list[UUID],
    sprint_id: Optional[UUID],
) -> int:
    """
    Move a list of issues to a sprint (or backlog when sprint_id is None).

    Delegates to issue_service.bulk_move_issues_to_sprint via lazy import.
    Permission check is the caller's responsibility.
    Returns the count of updated rows.
    """
    from apps.issues.services.issue_service import bulk_move_issues_to_sprint

    return bulk_move_issues_to_sprint(issue_ids, sprint_id)
