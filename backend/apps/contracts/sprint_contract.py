"""
Sprint module contract — DTOs and narrow read interfaces.

Read methods delegate to apps.sprints selectors (Phase 3 Slice 6).
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


def _to_summary_dto(sprint) -> SprintSummaryDTO:
    return SprintSummaryDTO(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        status=sprint.status,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
    )


def _to_detail_dto(sprint) -> SprintDetailDTO:
    return SprintDetailDTO(
        id=sprint.id,
        project_id=sprint.project_id,
        name=sprint.name,
        status=sprint.status,
        start_date=sprint.start_date,
        end_date=sprint.end_date,
        goal=sprint.goal or "",
    )


def list_active_sprints_for_project(project_id: UUID) -> list[SprintSummaryDTO]:
    from apps.sprints.selectors import get_active_sprints

    return [_to_summary_dto(sprint) for sprint in get_active_sprints(project_id)]


def get_active_sprint(project_id: UUID) -> Optional[SprintSummaryDTO]:
    from apps.sprints.selectors import get_active_sprint as _get_active_sprint

    sprint = _get_active_sprint(project_id)
    return _to_summary_dto(sprint) if sprint is not None else None


def get_sprint_by_id(sprint_id: UUID) -> Optional[SprintDetailDTO]:
    from apps.sprints.selectors import get_sprint_by_id as _get_sprint_by_id

    sprint = _get_sprint_by_id(sprint_id)
    return _to_detail_dto(sprint) if sprint is not None else None


def get_sprint_summary(sprint_id: UUID) -> Optional[SprintSummaryDTO]:
    from apps.sprints.selectors import get_sprint_by_id as _get_sprint_by_id

    sprint = _get_sprint_by_id(sprint_id)
    return _to_summary_dto(sprint) if sprint is not None else None


def list_sprints_for_project(project_id: UUID) -> list[SprintSummaryDTO]:
    from apps.sprints.selectors import get_project_sprints

    return [_to_summary_dto(sprint) for sprint in get_project_sprints(project_id)]


def get_sprint_metrics(sprint_id: UUID) -> dict[str, int] | None:
    from apps.sprints.selectors import get_sprint_metrics as _get_sprint_metrics

    return _get_sprint_metrics(sprint_id)
