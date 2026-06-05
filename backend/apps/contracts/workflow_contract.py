"""
Workflow module contract — status/transition DTOs and config interfaces.

Implementation deferred to Phase 6 (Workflow).
"""
from dataclasses import dataclass, field
from uuid import UUID


@dataclass(frozen=True)
class WorkflowStatusDTO:
    id: UUID
    name: str
    category: str
    order: int


@dataclass(frozen=True)
class WorkflowTransitionDTO:
    id: UUID
    from_status_id: UUID
    to_status_id: UUID
    name: str


@dataclass(frozen=True)
class WorkflowConfigDTO:
    project_id: UUID
    statuses: list[WorkflowStatusDTO] = field(default_factory=list)
    transitions: list[WorkflowTransitionDTO] = field(default_factory=list)


def get_workflow_config(project_id: UUID) -> WorkflowConfigDTO:
    """Stub — implemented in apps.workflow (Phase 6)."""
    raise NotImplementedError("workflow_contract.get_workflow_config — Phase 6")


def is_valid_transition(
    project_id: UUID,
    from_status_id: UUID,
    to_status_id: UUID,
) -> bool:
    """Stub — implemented in apps.workflow (Phase 6)."""
    raise NotImplementedError("workflow_contract.is_valid_transition — Phase 6")
