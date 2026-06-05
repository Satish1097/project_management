"""
Sprint module contract — DTOs and narrow read interfaces.

Implementation deferred to Phase 5 (Sprint).
"""
from dataclasses import dataclass
from datetime import date
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
    issue_count: int = 0


def get_active_sprint(project_id: UUID) -> Optional[SprintSummaryDTO]:
    """Stub — implemented in apps.sprint (Phase 5)."""
    raise NotImplementedError("sprint_contract.get_active_sprint — Phase 5")


def get_sprint_summary(sprint_id: UUID) -> Optional[SprintSummaryDTO]:
    """Stub — implemented in apps.sprint (Phase 5)."""
    raise NotImplementedError("sprint_contract.get_sprint_summary — Phase 5")
