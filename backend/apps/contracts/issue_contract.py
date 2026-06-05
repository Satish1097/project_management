"""
Issue module contract — DTOs and narrow read/write interfaces.

Implementation deferred to Phase 7+ (Issue Core / Transitions).
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID


@dataclass(frozen=True)
class IssueBoardDTO:
    id: UUID
    key: str
    title: str
    status_id: UUID
    priority: str
    assignee_id: Optional[UUID] = None
    sprint_id: Optional[UUID] = None
    labels: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class IssueDetailDTO:
    id: UUID
    key: str
    title: str
    description: str
    status_id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime


def get_sprint_issues(sprint_id: UUID) -> list[IssueBoardDTO]:
    """Stub — implemented in apps.issue (Phase 7)."""
    raise NotImplementedError("issue_contract.get_sprint_issues — Phase 7")


def apply_status_change(issue_id: UUID, target_status_id: UUID, actor_id: UUID) -> None:
    """Stub — called by workflow.TransitionService (Phase 8)."""
    raise NotImplementedError("issue_contract.apply_status_change — Phase 8")
