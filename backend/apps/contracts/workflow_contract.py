"""
Workflow module contract — status/transition DTOs and config interfaces.

Implementation deferred to Phase 3 Slice 4+.
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
    """Stub — implemented in apps.workflow selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def get_status_by_slug(project_id: UUID, slug: str) -> Optional[WorkflowStatusDTO]:
    """Stub — implemented in apps.workflow selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def is_valid_transition(
    project_id: UUID,
    from_slug: str,
    to_slug: str,
) -> bool:
    """Stub — implemented in apps.workflow services (Phase 3 Slice 4)."""
    raise NotImplementedError


def get_allowed_transitions(
    project_id: UUID,
    from_slug: str,
) -> list[WorkflowTransitionDTO]:
    """Stub — implemented in apps.workflow selectors (Phase 3 Slice 6)."""
    raise NotImplementedError


def seed_default_workflow(project_id: UUID) -> None:
    """Stub — implemented in apps.workflow seed_service (Phase 3 Slice 4)."""
    raise NotImplementedError
