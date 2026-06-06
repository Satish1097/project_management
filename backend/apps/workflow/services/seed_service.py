from uuid import UUID

from django.db import transaction

from apps.projects.models import Project
from apps.workflow.constants import DEFAULT_STATUSES, DEFAULT_TRANSITIONS
from apps.workflow.models import WorkflowStatus, WorkflowTransition


def seed_default_workflow_for_project(project_id: UUID) -> None:
    project = Project.objects.get(pk=project_id)
    seed_default_workflow(project)


def seed_default_workflow(project: Project) -> None:
    """Create frozen statuses and transitions for a project. Idempotent."""
    with transaction.atomic():
        status_by_slug: dict[str, WorkflowStatus] = {}

        for status_def in DEFAULT_STATUSES:
            status, _ = WorkflowStatus.objects.get_or_create(
                project=project,
                slug=status_def["slug"],
                defaults={
                    "name": status_def["name"],
                    "category": status_def["category"],
                    "position": status_def["position"],
                    "is_default": status_def["is_default"],
                    "is_terminal": status_def["is_terminal"],
                },
            )
            status_by_slug[status.slug] = status

        for transition_def in DEFAULT_TRANSITIONS:
            from_status = status_by_slug[transition_def["from_slug"]]
            to_status = status_by_slug[transition_def["to_slug"]]
            WorkflowTransition.objects.get_or_create(
                project=project,
                from_status=from_status,
                to_status=to_status,
                defaults={
                    "name": transition_def["name"],
                    "requires_approval": transition_def["requires_approval"],
                },
            )
