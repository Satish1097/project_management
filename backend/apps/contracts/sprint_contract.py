"""
Sprint module contract — DTOs and narrow read interfaces.

Implementation deferred to Phase 3 Slice 6+.
"""
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional
from uuid import UUID


@dataclass(frozen=True)
class SprintSummaryDTO:
    id: UUID
    project_id: UUID
    name: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


@dataclass(frozen=True, kw_only=True)
class SprintDetailDTO(SprintSummaryDTO):
    goal: str = ""
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


def get_active_sprint(project_id: UUID) -> Optional[SprintSummaryDTO]:
    """Stub — implemented in apps.sprints selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_sprint_by_id(sprint_id: UUID) -> Optional[SprintDetailDTO]:
    """Stub — implemented in apps.sprints selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_sprint_summary(sprint_id: UUID) -> Optional[SprintSummaryDTO]:
    """Stub — implemented in apps.sprints selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def list_sprints_for_project(project_id: UUID) -> list[SprintSummaryDTO]:
    """Stub — implemented in apps.sprints selectors (Phase 3 Slice 6)."""
    raise NotImplementedError
