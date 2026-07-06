"""
Workflow module contract — status/transition DTOs and config interfaces.

Read methods delegate to apps.workflow selectors (Phase 3 Slice 6).
Seed delegates to apps.workflow services.
"""
from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID


@dataclass(frozen=True)
class WorkflowStatusDTO:
    id: UUID
    name: str
    slug: str
    category: str
    position: int
    is_default: bool
    is_terminal: bool


@dataclass(frozen=True)
class WorkflowTransitionDTO:
    id: UUID
    from_status_slug: str
    to_status_slug: str
    name: str
    requires_approval: bool


@dataclass(frozen=True)
class WorkflowConfigDTO:
    project_id: UUID
    statuses: list[WorkflowStatusDTO] = field(default_factory=list)
    transitions: list[WorkflowTransitionDTO] = field(default_factory=list)


def get_workflow_config(project_id: UUID) -> WorkflowConfigDTO:
    from apps.workflow.selectors import select_workflow_config

    return select_workflow_config(project_id)


def get_status_by_slug(project_id: UUID, slug: str) -> Optional[WorkflowStatusDTO]:
    from apps.workflow.selectors import select_status_by_slug

    return select_status_by_slug(project_id, slug)


def is_valid_transition(
    project_id: UUID,
    from_slug: str,
    to_slug: str,
) -> bool:
    from apps.workflow.selectors import select_is_valid_transition

    return select_is_valid_transition(project_id, from_slug, to_slug)


def get_allowed_transitions(
    project_id: UUID,
    from_slug: str,
) -> list[WorkflowTransitionDTO]:
    from apps.workflow.selectors import select_allowed_transitions

    return select_allowed_transitions(project_id, from_slug)


def seed_default_workflow(project_id: UUID) -> None:
    from apps.workflow.services.seed_service import seed_default_workflow_for_project

    seed_default_workflow_for_project(project_id)


def ensure_project_workflow(project_id: UUID) -> None:
    from apps.workflow.services.seed_service import ensure_project_workflow as _ensure

    _ensure(project_id)
