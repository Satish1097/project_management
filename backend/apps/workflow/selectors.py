"""
Read-only workflow lookups and projections for apps.workflow.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from apps.contracts.workflow_contract import (
    WorkflowConfigDTO,
    WorkflowStatusDTO,
    WorkflowTransitionDTO,
)
from apps.workflow.models import WorkflowStatus, WorkflowTransition


def _status_to_dto(status: WorkflowStatus) -> WorkflowStatusDTO:
    return WorkflowStatusDTO(
        id=status.id,
        name=status.name,
        slug=status.slug,
        category=status.category,
        position=status.position,
        is_default=status.is_default,
        is_terminal=status.is_terminal,
    )


def _transition_to_dto(transition: WorkflowTransition) -> WorkflowTransitionDTO:
    return WorkflowTransitionDTO(
        id=transition.id,
        from_status_slug=transition.from_status.slug,
        to_status_slug=transition.to_status.slug,
        name=transition.name,
        requires_approval=transition.requires_approval,
    )


def select_workflow_config(project_id: UUID) -> WorkflowConfigDTO:
    statuses = WorkflowStatus.objects.filter(project_id=project_id).order_by("position")
    transitions = WorkflowTransition.objects.filter(project_id=project_id).select_related(
        "from_status",
        "to_status",
    )
    return WorkflowConfigDTO(
        project_id=project_id,
        statuses=[_status_to_dto(status) for status in statuses],
        transitions=[_transition_to_dto(transition) for transition in transitions],
    )


def select_status_by_slug(project_id: UUID, slug: str) -> WorkflowStatusDTO | None:
    try:
        status = WorkflowStatus.objects.get(project_id=project_id, slug=slug)
    except WorkflowStatus.DoesNotExist:
        return None
    return _status_to_dto(status)


def select_is_valid_transition(
    project_id: UUID,
    from_slug: str,
    to_slug: str,
) -> bool:
    return WorkflowTransition.objects.filter(
        project_id=project_id,
        from_status__slug=from_slug,
        to_status__slug=to_slug,
    ).exists()


def select_allowed_transitions(
    project_id: UUID,
    from_slug: str,
) -> list[WorkflowTransitionDTO]:
    transitions = (
        WorkflowTransition.objects.filter(
            project_id=project_id,
            from_status__slug=from_slug,
        )
        .select_related("from_status", "to_status")
        .order_by("to_status__position")
    )
    return [_transition_to_dto(transition) for transition in transitions]
