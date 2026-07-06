"""
Read-only workflow selectors for apps.workflow.
"""
from uuid import UUID

from django.db.models import QuerySet

from apps.contracts.workflow_contract import (
    WorkflowConfigDTO,
    WorkflowStatusDTO,
    WorkflowTransitionDTO,
)
from apps.workflow.constants import DEFAULT_STATUS_SLUG
from apps.workflow.models import WorkflowScheme, WorkflowStatus, WorkflowTransition
from apps.workflow.slug_utils import status_slug


def get_project_workflow(project_id: UUID) -> WorkflowScheme | None:
    return (
        WorkflowScheme.objects.filter(project_id=project_id)
        .only("id", "project_id", "name")
        .first()
    )


def get_project_statuses(project_id: UUID) -> QuerySet[WorkflowStatus]:
    return WorkflowStatus.objects.filter(project_id=project_id).only(
        "id",
        "project_id",
        "name",
        "category",
        "color",
        "order",
        "is_default",
    ).order_by("order")


def get_default_status(project_id: UUID) -> WorkflowStatus | None:
    return (
        WorkflowStatus.objects.filter(project_id=project_id, is_default=True)
        .only(
            "id",
            "project_id",
            "name",
            "category",
            "color",
            "order",
            "is_default",
        )
        .first()
    )


def get_status_by_id(status_id: UUID) -> WorkflowStatus | None:
    return WorkflowStatus.objects.filter(id=status_id).only(
        "id",
        "project_id",
        "name",
        "category",
        "color",
        "order",
        "is_default",
    ).first()


def get_project_transitions(project_id: UUID) -> QuerySet[WorkflowTransition]:
    return WorkflowTransition.objects.filter(project_id=project_id).select_related(
        "from_status",
        "to_status",
    )


def get_allowed_transitions(
    project_id: UUID,
    from_status_id: UUID,
) -> QuerySet[WorkflowTransition]:
    return WorkflowTransition.objects.filter(
        project_id=project_id,
        from_status_id=from_status_id,
    ).select_related("from_status", "to_status")


def _status_slug(status: WorkflowStatus) -> str:
    return status_slug(name=status.name, category=status.category)


def _to_status_dto(status: WorkflowStatus) -> WorkflowStatusDTO:
    return WorkflowStatusDTO(
        id=status.id,
        name=status.name,
        slug=_status_slug(status),
        category=status.category,
        position=status.order,
        is_default=status.is_default,
        is_terminal=_status_slug(status) == "done",
    )


def select_workflow_config(project_id: UUID) -> WorkflowConfigDTO:
    statuses = list(get_project_statuses(project_id))
    transitions = list(get_project_transitions(project_id))
    return WorkflowConfigDTO(
        project_id=project_id,
        statuses=[_to_status_dto(status) for status in statuses],
        transitions=[
            WorkflowTransitionDTO(
                id=transition.id,
                from_status_slug=_status_slug(transition.from_status),
                to_status_slug=_status_slug(transition.to_status),
                name=transition.name,
                requires_approval=False,
            )
            for transition in transitions
        ],
    )


def select_status_by_slug(project_id: UUID, slug: str) -> WorkflowStatusDTO | None:
    normalized = slug.strip().lower().replace("-", "_")
    statuses = get_project_statuses(project_id)
    for status in statuses:
        if _status_slug(status) == normalized:
            return _to_status_dto(status)
    if normalized == DEFAULT_STATUS_SLUG:
        default_status = get_default_status(project_id)
        if default_status is not None:
            return _to_status_dto(default_status)
    return None


def select_is_valid_transition(project_id: UUID, from_slug: str, to_slug: str) -> bool:
    from_status = select_status_by_slug(project_id, from_slug)
    to_status = select_status_by_slug(project_id, to_slug)
    if from_status is None or to_status is None:
        return False
    return WorkflowTransition.objects.filter(
        project_id=project_id,
        from_status_id=from_status.id,
        to_status_id=to_status.id,
    ).exists()


def select_allowed_transitions(
    project_id: UUID,
    from_slug: str,
) -> list[WorkflowTransitionDTO]:
    from_status = select_status_by_slug(project_id, from_slug)
    if from_status is None:
        return []
    return [
        WorkflowTransitionDTO(
            id=transition.id,
            from_status_slug=_status_slug(transition.from_status),
            to_status_slug=_status_slug(transition.to_status),
            name=transition.name,
            requires_approval=False,
        )
        for transition in get_allowed_transitions(project_id, from_status.id)
    ]
