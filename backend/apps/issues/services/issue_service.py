"""
Issue write services — create, update, assign, transition, move sprint.

All authorization flows through PermissionService; no inline role checks.
Transition logic is delegated to workflow.TransitionService via contract only.
"""
from decimal import Decimal
from uuid import UUID

from django.db import transaction
from django.db.models import Max

from apps.contracts.issue_contract import IssueDetailDTO
from apps.contracts.membership_contract import get_project_member
from apps.contracts.workflow_contract import get_status_by_slug
from apps.issues.exceptions import (
    ArchivedProjectIssueError,
    IssueAssignmentError,
    IssueError,
    IssueNotFoundError,
    IssueValidationError,
)
from apps.issues.models import Issue, IssueType
from apps.issues.selectors import select_issue_by_id
from apps.permissions.services import permission_service
from apps.projects.models import Project, ProjectStatus


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_issue_or_raise(issue_id: UUID) -> Issue:
    try:
        return Issue.objects.select_related("status", "project").get(pk=issue_id)
    except Issue.DoesNotExist:
        raise IssueNotFoundError(f"Issue '{issue_id}' not found.")


def _get_project_or_raise(project_id: UUID) -> Project:
    try:
        return Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        from apps.projects.exceptions import ProjectNotFoundError

        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _reject_archived_project(project: Project) -> None:
    if project.status == ProjectStatus.ARCHIVED:
        raise ArchivedProjectIssueError("Archived projects are read-only.")


def _end_of_column_position(
    project_id: UUID,
    status_id: UUID,
    sprint_id: UUID | None,
) -> Decimal:
    qs = Issue.objects.filter(project_id=project_id, status_id=status_id)
    if sprint_id is None:
        qs = qs.filter(sprint__isnull=True)
    else:
        qs = qs.filter(sprint_id=sprint_id)
    max_pos = qs.aggregate(m=Max("position"))["m"]
    return (max_pos + Decimal("1000")) if max_pos is not None else Decimal("1000")


# ---------------------------------------------------------------------------
# create_issue
# ---------------------------------------------------------------------------


def create_issue(
    *,
    project_id: UUID,
    title: str,
    actor_id: UUID,
    description: str = "",
    issue_type: str = IssueType.TASK,
    priority: str = "medium",
    assignee_id: UUID | None = None,
    sprint_id: UUID | None = None,
    parent_issue_id: UUID | None = None,
    story_points: int | None = None,
    due_date=None,
    labels: list[str] | None = None,
) -> IssueDetailDTO:
    """
    Create a new issue for the project.

    Flow:
      - validate project exists
      - reject archived project
      - permission_service.can_create_issue()
      - validate issue_type / parent_issue rules
      - validate sprint membership and status
      - resolve default workflow status (todo)
      - atomically increment Project.next_issue_number
      - generate key {PROJECT_KEY}-{number}
      - position at end of column
      - create Issue
      - return IssueDetailDTO
    """
    project = _get_project_or_raise(project_id)
    _reject_archived_project(project)

    if not permission_service.can_create_issue(actor_id, project_id):
        raise IssueError("Permission denied: cannot create issues in this project.")

    # Validate issue_type / parent_issue consistency
    if issue_type == IssueType.SUBTASK and parent_issue_id is None:
        raise IssueValidationError("Subtask requires a parent issue.")
    if issue_type != IssueType.SUBTASK and parent_issue_id is not None:
        raise IssueValidationError("Only subtasks may have a parent issue.")

    if parent_issue_id is not None:
        try:
            parent = Issue.objects.get(pk=parent_issue_id)
        except Issue.DoesNotExist:
            raise IssueNotFoundError(f"Parent issue '{parent_issue_id}' not found.")
        if parent.project_id != project_id:
            raise IssueValidationError("Parent issue must belong to the same project.")
        if parent.issue_type == IssueType.SUBTASK:
            raise IssueValidationError(
                "Cannot nest subtasks — maximum depth is one level."
            )

    # Validate sprint (if provided)
    if sprint_id is not None:
        from apps.sprints.exceptions import SprintNotFoundError
        from apps.sprints.models import Sprint, SprintStatus

        try:
            sprint_obj = Sprint.objects.get(pk=sprint_id)
        except Sprint.DoesNotExist:
            raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")
        if sprint_obj.project_id != project_id:
            raise IssueValidationError("Sprint must belong to the same project.")
        if sprint_obj.status == SprintStatus.COMPLETED:
            raise IssueValidationError("Cannot assign issue to a completed sprint.")

    # Resolve default workflow status (todo)
    status_dto = get_status_by_slug(project_id, "todo")
    if status_dto is None:
        from apps.workflow.exceptions import WorkflowStatusNotFoundError

        raise WorkflowStatusNotFoundError(
            "Default 'todo' workflow status not found for project. "
            "Ensure workflow is seeded."
        )

    with transaction.atomic():
        locked_project = Project.objects.select_for_update().get(pk=project_id)
        locked_project.next_issue_number += 1
        locked_project.save(update_fields=["next_issue_number"])
        number = locked_project.next_issue_number
        key = f"{locked_project.key}-{number}"

        position = _end_of_column_position(project_id, status_dto.id, sprint_id)

        issue = Issue.objects.create(
            project_id=project_id,
            number=number,
            key=key,
            title=title.strip(),
            description=description,
            status_id=status_dto.id,
            priority=priority,
            issue_type=issue_type,
            reporter_id=actor_id,
            assignee_id=assignee_id,
            sprint_id=sprint_id,
            parent_issue_id=parent_issue_id,
            story_points=story_points,
            due_date=due_date,
            labels=labels or [],
            position=position,
            created_by_id=actor_id,
            updated_by_id=actor_id,
        )

    result = select_issue_by_id(issue.pk)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# update_issue
# ---------------------------------------------------------------------------


_SENTINEL = object()


def update_issue(
    *,
    issue_id: UUID,
    actor_id: UUID,
    title: str | None = None,
    description: str | None = None,
    priority: str | None = None,
    story_points=_SENTINEL,
    due_date=_SENTINEL,
    labels: list[str] | None = None,
    parent_issue_id=_SENTINEL,
) -> IssueDetailDTO:
    """
    Update allowed fields on an existing issue.

    Allowed: title, description, priority, story_points, due_date, labels,
             parent_issue.
    NOT allowed: status (use transition endpoint), sprint (use move-sprint endpoint).
    """
    issue = _get_issue_or_raise(issue_id)
    _reject_archived_project(issue.project)

    if not permission_service.can_edit_issue(actor_id, issue.project_id):
        raise IssueError("Permission denied: cannot edit this issue.")

    update_fields = ["updated_by_id", "updated_at"]

    if title is not None:
        issue.title = title.strip()
        update_fields.append("title")
    if description is not None:
        issue.description = description
        update_fields.append("description")
    if priority is not None:
        issue.priority = priority
        update_fields.append("priority")
    if story_points is not _SENTINEL:
        issue.story_points = story_points
        update_fields.append("story_points")
    if due_date is not _SENTINEL:
        issue.due_date = due_date
        update_fields.append("due_date")
    if labels is not None:
        issue.labels = labels
        update_fields.append("labels")

    if parent_issue_id is not _SENTINEL:
        if parent_issue_id is None:
            if issue.issue_type == IssueType.SUBTASK:
                raise IssueValidationError("Cannot remove parent from a subtask.")
            issue.parent_issue_id = None
            update_fields.append("parent_issue_id")
        else:
            try:
                parent = Issue.objects.get(pk=parent_issue_id)
            except Issue.DoesNotExist:
                raise IssueNotFoundError(
                    f"Parent issue '{parent_issue_id}' not found."
                )
            if parent.project_id != issue.project_id:
                raise IssueValidationError(
                    "Parent issue must belong to the same project."
                )
            if parent.issue_type == IssueType.SUBTASK:
                raise IssueValidationError(
                    "Cannot nest subtasks — maximum depth is one level."
                )
            issue.parent_issue_id = parent_issue_id
            update_fields.append("parent_issue_id")

    issue.updated_by_id = actor_id
    issue.save(update_fields=update_fields)

    result = select_issue_by_id(issue_id)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# assign_issue
# ---------------------------------------------------------------------------


def assign_issue(
    *,
    issue_id: UUID,
    assignee_id: UUID | None,
    actor_id: UUID,
) -> IssueDetailDTO:
    """
    Assign (or unassign) an issue.

    Rules:
      - permission_service.can_assign_issue()
      - assignee must be a ProjectMember
      - viewer role cannot be assignee
    """
    issue = _get_issue_or_raise(issue_id)
    _reject_archived_project(issue.project)

    if not permission_service.can_assign_issue(actor_id, issue.project_id):
        raise IssueAssignmentError(
            "Permission denied: cannot assign issues in this project."
        )

    if assignee_id is not None:
        member = get_project_member(assignee_id, issue.project_id)
        if member is None:
            raise IssueAssignmentError(
                f"User '{assignee_id}' is not a member of this project."
            )
        if not permission_service.can_be_assigned(assignee_id, issue.project_id):
            raise IssueAssignmentError("Viewers cannot be assigned to issues.")

    issue.assignee_id = assignee_id
    issue.updated_by_id = actor_id
    issue.save(update_fields=["assignee_id", "updated_by_id", "updated_at"])

    result = select_issue_by_id(issue_id)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# transition_issue
# ---------------------------------------------------------------------------


def transition_issue(
    *,
    issue_id: UUID,
    to_status_slug: str,
    actor_id: UUID,
) -> IssueDetailDTO:
    """
    Transition an issue to a new workflow status.

    Delegates ONLY to workflow.TransitionService via contract — no inline
    workflow logic here.
    """
    from apps.contracts.issue_contract import apply_status_change

    apply_status_change(issue_id, to_status_slug, actor_id)

    result = select_issue_by_id(issue_id)
    if result is None:
        raise IssueNotFoundError(f"Issue '{issue_id}' not found.")
    return result


# ---------------------------------------------------------------------------
# move_issue_to_sprint
# ---------------------------------------------------------------------------


def move_issue_to_sprint(
    *,
    issue_id: UUID,
    sprint_id: UUID | None,
    actor_id: UUID,
) -> IssueDetailDTO:
    """
    Move an issue to a sprint or to the backlog (sprint_id=None).

    Rules:
      - permission_service.can_plan_sprint()
      - sprint must be in same project
      - cannot assign to completed sprint
      - repositioned to end of current status column in new context
    """
    issue = _get_issue_or_raise(issue_id)
    _reject_archived_project(issue.project)

    if not permission_service.can_plan_sprint(actor_id, issue.project_id):
        raise IssueError("Permission denied: cannot plan sprint for this project.")

    if sprint_id is not None:
        from apps.sprints.exceptions import SprintNotFoundError
        from apps.sprints.models import Sprint, SprintStatus

        try:
            sprint_obj = Sprint.objects.get(pk=sprint_id)
        except Sprint.DoesNotExist:
            raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")
        if sprint_obj.project_id != issue.project_id:
            raise IssueValidationError("Sprint must belong to the same project.")
        if sprint_obj.status == SprintStatus.COMPLETED:
            raise IssueValidationError("Cannot move issue to a completed sprint.")

    issue.sprint_id = sprint_id
    issue.position = _end_of_column_position(
        issue.project_id, issue.status_id, sprint_id
    )
    issue.updated_by_id = actor_id
    issue.save(update_fields=["sprint_id", "position", "updated_by_id", "updated_at"])

    result = select_issue_by_id(issue_id)
    assert result is not None
    return result


# ---------------------------------------------------------------------------
# bulk_move_issues_to_sprint  (internal — called via issue_contract.bulk_set_sprint)
# ---------------------------------------------------------------------------


def bulk_move_issues_to_sprint(
    issue_ids: list[UUID],
    sprint_id: UUID | None,
) -> int:
    """
    Move multiple issues to a sprint (or backlog).

    Internal function — permission check is the caller's responsibility.
    Returns the count of updated rows.
    """
    if not issue_ids:
        return 0
    return Issue.objects.filter(pk__in=issue_ids).update(sprint_id=sprint_id)
