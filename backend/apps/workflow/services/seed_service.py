from uuid import UUID

from django.db import transaction

from apps.projects.models import Project
from apps.workflow.constants import DEFAULT_STATUSES, DEFAULT_TRANSITIONS
from apps.workflow.models import WorkflowScheme, WorkflowStatus, WorkflowTransition

DEFAULT_SCHEME_NAME = "Default Workflow"


def _map_category(slug: str, raw_category: str) -> str:
    # Backward-compatible mapping from legacy constants to new category choices.
    if slug == "todo":
        return "todo"
    if slug == "in_progress":
        return "in_progress"
    if slug == "done":
        return "done"
    if raw_category in {"todo", "in_progress", "done"}:
        return raw_category
    if raw_category in {"pending", "review", "blocked"}:
        return "todo"
    if raw_category in {"active"}:
        return "in_progress"
    if raw_category in {"complete"}:
        return "done"
    return "todo"


def seed_default_workflow_for_project(project_id: UUID) -> None:
    project = Project.objects.get(pk=project_id)
    seed_default_workflow(project)


def ensure_project_workflow(project_id: UUID) -> None:
    """Seed default workflow when a project has no statuses (dev bootstrap)."""
    if WorkflowStatus.objects.filter(project_id=project_id).exists():
        WorkflowScheme.objects.get_or_create(
            project_id=project_id,
            defaults={"name": DEFAULT_SCHEME_NAME},
        )
        return
    seed_default_workflow_for_project(project_id)


def seed_default_workflow(project: Project) -> None:
    """Create frozen statuses and transitions for a project. Idempotent."""
    with transaction.atomic():
        WorkflowScheme.objects.get_or_create(
            project=project,
            defaults={"name": DEFAULT_SCHEME_NAME},
        )

        status_by_slug: dict[str, WorkflowStatus] = {}

        for status_def in DEFAULT_STATUSES:
            status, _ = WorkflowStatus.objects.get_or_create(
                project=project,
                name=status_def["name"],
                defaults={
                    "category": _map_category(
                        status_def["slug"], status_def["category"]
                    ),
                    "order": status_def["position"],
                    "is_default": status_def["is_default"],
                    "color": "#94A3B8",
                },
            )
            status_by_slug[status_def["slug"]] = status

        for transition_def in DEFAULT_TRANSITIONS:
            from_status = status_by_slug.get(transition_def["from_slug"])
            to_status = status_by_slug.get(transition_def["to_slug"])
            if from_status is None or to_status is None:
                continue
            WorkflowTransition.objects.get_or_create(
                project=project,
                from_status=from_status,
                to_status=to_status,
                defaults={
                    "name": transition_def["name"],
                },
            )
