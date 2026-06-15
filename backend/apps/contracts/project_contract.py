"""
Project module contract — DTOs and narrow read interfaces.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from uuid import UUID

from apps.contracts.workflow_contract import WorkflowStatusDTO


@dataclass(frozen=True)
class ProjectDTO:
    id: UUID
    organization_id: UUID
    key: str
    slug: str
    name: str
    description: str
    status: str
    lead_user_id: Optional[UUID]
    visibility: str
    archived_at: Optional[datetime] = None


@dataclass(frozen=True)
class ProjectSummaryDTO:
    id: UUID
    key: str
    slug: str
    name: str
    status: str
    open_issue_count: int = 0
    active_sprint_id: Optional[UUID] = None


@dataclass(frozen=True)
class ProjectMemberDTO:
    project_id: UUID
    user_id: UUID
    role: str
    joined_at: Optional[datetime] = None


@dataclass(frozen=True)
class ProjectBoardContextDTO:
    project_id: UUID
    active_sprint_id: Optional[UUID] = None
    workflow_statuses: list[WorkflowStatusDTO] = field(default_factory=list)


def get_project_board_context(project_id: UUID) -> Optional[ProjectBoardContextDTO]:
    """Stub — implemented in apps.projects selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_project_by_id(project_id: UUID) -> Optional[ProjectDTO]:
    from apps.projects.selectors import select_project_by_id

    return select_project_by_id(project_id)


def get_project_summary(project_id: UUID) -> Optional[ProjectSummaryDTO]:
    from apps.projects.selectors import select_project_summary

    return select_project_summary(project_id)


def get_projects_for_organization(org_id: UUID, user_id: UUID) -> list[ProjectSummaryDTO]:
    from apps.projects.selectors import select_projects_for_organization

    return select_projects_for_organization(org_id, user_id)
