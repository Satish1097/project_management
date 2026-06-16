"""
Read-only workflow selectors for apps.workflow.
"""
from uuid import UUID

from django.db.models import QuerySet

from apps.workflow.models import WorkflowScheme, WorkflowStatus, WorkflowTransition


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
