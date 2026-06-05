"""
Issue module contract — DTOs and narrow read/write interfaces.

Implementation deferred to Phase 3 Slice 4+.
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
class IssueKanbanDTO:
    project_id: UUID
    columns: list[IssueBoardColumnDTO] = field(default_factory=list)


def get_issue_by_id(issue_id: UUID) -> Optional[IssueDetailDTO]:
    """Stub — implemented in apps.issues selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_issues_for_project(project_id: UUID) -> list[IssueSummaryDTO]:
    """Stub — implemented in apps.issues selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_backlog_issues(project_id: UUID) -> list[IssueSummaryDTO]:
    """Stub — implemented in apps.issues selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_kanban_board(
    project_id: UUID,
    sprint_id: Optional[UUID] = None,
) -> IssueKanbanDTO:
    """Stub — implemented in apps.issues selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_sprint_issues(sprint_id: UUID) -> list[IssueSummaryDTO]:
    """Stub — implemented in apps.issues selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def apply_status_change(issue_id: UUID, status_slug: str) -> None:
    """Stub — called by workflow.TransitionService (Phase 3 Slice 4)."""
    raise NotImplementedError


def bulk_set_sprint(
    issue_ids: list[UUID],
    sprint_id: Optional[UUID],
) -> int:
    """Stub — implemented in apps.issues services (Phase 3 Slice 7)."""
    raise NotImplementedError
