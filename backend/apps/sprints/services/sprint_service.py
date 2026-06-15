"""
Sprint lifecycle services — create, update, start, complete, bulk move issues.

All authorization flows through PermissionService; no inline role checks.
Issue mutations during carry-forward use issue_contract.bulk_set_sprint to
respect cross-module boundaries.
"""
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from apps.contracts.issue_contract import bulk_set_sprint, get_sprint_issues
from apps.contracts.sprint_contract import SprintDetailDTO
from apps.permissions.services import permission_service
from apps.projects.models import Project, ProjectStatus
from apps.sprints.exceptions import (
    ArchivedProjectSprintError,
    SprintAlreadyActiveError,
    SprintCompletionError,
    SprintError,
    SprintNotFoundError,
)
from apps.sprints.models import Sprint, SprintStatus
from apps.sprints.selectors import select_sprint_by_id


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_sprint_or_raise(sprint_id: UUID) -> Sprint:
    try:
        return Sprint.objects.select_related("project").get(pk=sprint_id)
    except Sprint.DoesNotExist:
        raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")


def _get_project_or_raise(project_id: UUID) -> Project:
    try:
        return Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        from apps.projects.exceptions import ProjectNotFoundError

        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _reject_archived_project(project: Project) -> None:
    if project.status == ProjectStatus.ARCHIVED:
        raise ArchivedProjectSprintError("Archived projects are read-only.")


# ---------------------------------------------------------------------------
# create_sprint
# ---------------------------------------------------------------------------


def create_sprint(
    *,
    project_id: UUID,
    name: str,
    actor_id: UUID,
    goal: str = "",
    start_date=None,
    end_date=None,
) -> SprintDetailDTO:
    """
    Create a new sprint in planned status.

    Permission: can_plan_sprint()
    """
    project = _get_project_or_raise(project_id)
    _reject_archived_project(project)

    if not permission_service.can_plan_sprint(actor_id, project_id):
        raise SprintError("Permission denied: cannot create sprints in this project.")

    sprint = Sprint.objects.create(
        project=project,
        name=name.strip(),
        goal=goal,
        status=SprintStatus.PLANNED,
        start_date=start_date,
        end_date=end_date,
        created_by_id=actor_id,
        updated_by_id=actor_id,
    )

    result = select_sprint_by_id(sprint.pk)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# update_sprint
# ---------------------------------------------------------------------------

_SENTINEL = object()


def update_sprint(
    *,
    sprint_id: UUID,
    actor_id: UUID,
    name: str | None = None,
    goal: str | None = None,
    start_date=_SENTINEL,
    end_date=_SENTINEL,
) -> SprintDetailDTO:
    """
    Update allowed fields on a sprint.

    Allowed: name, goal, start_date, end_date.
    NOT allowed: status (use start/complete endpoints).
    Completed sprints are read-only.

    Permission: can_manage_sprint()
    """
    sprint = _get_sprint_or_raise(sprint_id)
    _reject_archived_project(sprint.project)

    if sprint.status == SprintStatus.COMPLETED:
        raise SprintCompletionError("Completed sprints are read-only.")

    if not permission_service.can_manage_sprint(actor_id, sprint.project_id):
        raise SprintError("Permission denied: cannot update this sprint.")

    update_fields = ["updated_by_id", "updated_at"]

    if name is not None:
        sprint.name = name.strip()
        update_fields.append("name")
    if goal is not None:
        sprint.goal = goal
        update_fields.append("goal")
    if start_date is not _SENTINEL:
        sprint.start_date = start_date
        update_fields.append("start_date")
    if end_date is not _SENTINEL:
        sprint.end_date = end_date
        update_fields.append("end_date")

    sprint.updated_by_id = actor_id
    sprint.save(update_fields=update_fields)

    result = select_sprint_by_id(sprint_id)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# start_sprint
# ---------------------------------------------------------------------------


def start_sprint(
    *,
    sprint_id: UUID,
    actor_id: UUID,
) -> SprintDetailDTO:
    """
    Transition a sprint from planned → active.

    Rules:
      - can_manage_sprint()
      - sprint must be planned
      - at most one active sprint per project (409 if another is active)
      - sets started_at to now
    """
    sprint = _get_sprint_or_raise(sprint_id)
    _reject_archived_project(sprint.project)

    if not permission_service.can_manage_sprint(actor_id, sprint.project_id):
        raise SprintError("Permission denied: cannot start sprints in this project.")

    if sprint.status != SprintStatus.PLANNED:
        raise SprintError(
            f"Only planned sprints can be started; "
            f"current status is '{sprint.status}'."
        )

    if (
        Sprint.objects.filter(
            project_id=sprint.project_id, status=SprintStatus.ACTIVE
        )
        .exclude(pk=sprint.pk)
        .exists()
    ):
        raise SprintAlreadyActiveError(
            "Another sprint is already active in this project. "
            "Complete it before starting a new one."
        )

    sprint.status = SprintStatus.ACTIVE
    sprint.started_at = timezone.now()
    sprint.updated_by_id = actor_id
    sprint.save(update_fields=["status", "started_at", "updated_by_id", "updated_at"])

    result = select_sprint_by_id(sprint_id)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# complete_sprint
# ---------------------------------------------------------------------------


def complete_sprint(
    *,
    sprint_id: UUID,
    actor_id: UUID,
    move_incomplete_to: str = "backlog",
    target_sprint_id: UUID | None = None,
) -> SprintDetailDTO:
    """
    Complete an active sprint with carry-forward for incomplete issues.

    Rules:
      - sprint must be active
      - can_manage_sprint()
      - incomplete issues (status_slug != 'done') are moved to:
          target sprint (planned, same project) if move_incomplete_to='sprint'
          backlog (sprint_id=None)             if move_incomplete_to='backlog'
      - done issues remain linked to this sprint (historical record)
      - sets completed_at to now; sprint becomes read-only
    """
    sprint = _get_sprint_or_raise(sprint_id)
    _reject_archived_project(sprint.project)

    if sprint.status != SprintStatus.ACTIVE:
        raise SprintCompletionError(
            f"Only active sprints can be completed; "
            f"current status is '{sprint.status}'."
        )

    if not permission_service.can_manage_sprint(actor_id, sprint.project_id):
        raise SprintError("Permission denied: cannot complete sprints in this project.")

    # Resolve target for incomplete issues
    resolved_target_sprint_id: UUID | None = None
    if move_incomplete_to == "sprint" and target_sprint_id is not None:
        try:
            target = Sprint.objects.get(pk=target_sprint_id)
        except Sprint.DoesNotExist:
            raise SprintNotFoundError(
                f"Target sprint '{target_sprint_id}' not found."
            )
        if target.project_id != sprint.project_id:
            raise SprintCompletionError(
                "Target sprint must belong to the same project."
            )
        if target.status != SprintStatus.PLANNED:
            raise SprintCompletionError(
                "Target sprint must be in 'planned' status to receive issues."
            )
        resolved_target_sprint_id = target_sprint_id

    with transaction.atomic():
        # Identify incomplete issues via contract (no direct Issue ORM import)
        sprint_issues = get_sprint_issues(sprint_id)
        incomplete_ids = [
            issue.id for issue in sprint_issues if issue.status_slug != "done"
        ]

        if incomplete_ids:
            bulk_set_sprint(incomplete_ids, resolved_target_sprint_id)

        sprint.status = SprintStatus.COMPLETED
        sprint.completed_at = timezone.now()
        sprint.updated_by_id = actor_id
        sprint.save(
            update_fields=["status", "completed_at", "updated_by_id", "updated_at"]
        )

    result = select_sprint_by_id(sprint_id)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# bulk_move_issues
# ---------------------------------------------------------------------------


def bulk_move_issues(
    *,
    sprint_id: UUID,
    issue_ids: list[UUID],
    target_sprint_id: UUID | None,
    actor_id: UUID,
) -> int:
    """
    Bulk-move issues from the given sprint to another sprint or backlog.

    Permission: can_plan_sprint()
    Returns the count of updated issues.
    """
    sprint = _get_sprint_or_raise(sprint_id)
    _reject_archived_project(sprint.project)

    if not permission_service.can_plan_sprint(actor_id, sprint.project_id):
        raise SprintError("Permission denied: cannot plan sprint for this project.")

    if target_sprint_id is not None:
        try:
            target = Sprint.objects.get(pk=target_sprint_id)
        except Sprint.DoesNotExist:
            raise SprintNotFoundError(
                f"Target sprint '{target_sprint_id}' not found."
            )
        if target.project_id != sprint.project_id:
            raise SprintError("Target sprint must belong to the same project.")
        if target.status == SprintStatus.COMPLETED:
            raise SprintCompletionError(
                "Cannot move issues to a completed sprint."
            )

    return bulk_set_sprint(issue_ids, target_sprint_id)
