"""
Issue Core write services — create, update, sprint assignment.

All authorization flows through PermissionService; no inline role checks.
No transition or board logic in this module.
"""
from decimal import Decimal
from uuid import UUID

from django.db import transaction

from apps.contracts.workflow_contract import ensure_project_workflow
from apps.issues.exceptions import (
    ArchivedProjectIssueError,
    IssueError,
    IssueNotFoundError,
    IssueValidationError,
)
from apps.issues.models import Issue, IssueActivityEventType, IssueType, Priority
from apps.issues.selectors import get_issue_by_id
from apps.issues.services.activity_service import (
    create_issue_activity,
    get_user_display_value,
)
from apps.label.models import Label
from apps.notifications.services import notification_service
from apps.permissions.services import permission_service
from apps.projects.models import Project, ProjectStatus
from apps.projects.services.project_service import require_scrum_project
from apps.sprints.exceptions import SprintNotFoundError
from apps.sprints.models import Sprint
from apps.workflow.exceptions import WorkflowStatusNotFoundError
from apps.workflow.selectors import get_default_status, get_project_statuses
from apps.workflow.slug_utils import status_slug

_FORBIDDEN_UPDATE_FIELDS = frozenset(
    {
        "key",
        "status",
        "status_id",
        "project",
        "project_id",
        "reporter",
        "reporter_id",
        "id",
        "created_at",
        "updated_at",
    }
)

_ALLOWED_UPDATE_FIELDS = frozenset(
    {
        "title",
        "description",
        "type",
        "priority",
        "sprint",
        "sprint_id",
        "assignee",
        "assignee_id",
        "labels",
        "label_ids",
        "due_date",
        "estimate_hours",
        "story_points",
        "parent_issue",
        "parent_issue_id",
    }
)


def _issue_is_done(issue: Issue) -> bool:
    slug = status_slug(name=issue.status.name, category=issue.status.category)
    return slug == "done"


def _get_done_status(project_id: UUID):
    for status in get_project_statuses(project_id):
        slug = status_slug(name=status.name, category=status.category)
        if slug == "done":
            return status
    return None


def _validate_parent_issue(
    project_id: UUID,
    issue_type: str,
    parent_issue_id: UUID | None,
) -> Issue | None:
    if issue_type == IssueType.SUBTASK:
        if parent_issue_id is None:
            raise IssueValidationError("Subtask requires a parent issue.")
    elif parent_issue_id is not None:
        raise IssueValidationError("Only subtasks may have a parent issue.")

    if parent_issue_id is None:
        return None

    parent = get_issue_by_id(parent_issue_id)
    if parent is None:
        raise IssueValidationError("Parent issue not found.")
    if parent.project_id != project_id:
        raise IssueValidationError("Parent issue must belong to the same project.")
    if parent.type == IssueType.SUBTASK:
        raise IssueValidationError("Subtasks cannot have nested subtasks.")
    return parent


def _get_issue_or_raise(issue_id: UUID) -> Issue:
    issue = get_issue_by_id(issue_id)
    if issue is None:
        raise IssueNotFoundError(f"Issue '{issue_id}' not found.")
    return issue


def _get_project_or_raise(project_id: UUID) -> Project:
    try:
        return Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        from apps.projects.exceptions import ProjectNotFoundError

        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _reject_archived_project(project: Project) -> None:
    if project.status == ProjectStatus.ARCHIVED:
        raise ArchivedProjectIssueError("Archived projects are read-only.")


def _validate_issue_type(issue_type: str) -> None:
    if issue_type not in IssueType.values:
        raise IssueValidationError(f"Invalid issue type: '{issue_type}'.")


def _validate_priority(priority: str) -> None:
    if priority not in Priority.values:
        raise IssueValidationError(f"Invalid priority: '{priority}'.")


def _validate_sprint(project_id: UUID, sprint_id: UUID) -> Sprint:
    try:
        sprint = Sprint.objects.get(pk=sprint_id)
    except Sprint.DoesNotExist:
        raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")
    if sprint.project_id != project_id:
        raise IssueValidationError("Sprint must belong to the same project.")
    return sprint


def _validate_label_ids(project_id: UUID, label_ids: list[UUID]) -> list[Label]:
    if not label_ids:
        return []

    labels = list(
        Label.objects.filter(pk__in=label_ids, project_id=project_id, is_archived=False)
    )
    if len(labels) != len(set(label_ids)):
        raise IssueValidationError(
            "One or more labels are invalid, archived, or not in this project."
        )
    return labels


def _resolve_default_status(project_id: UUID):
    ensure_project_workflow(project_id)
    default_status = get_default_status(project_id)
    if default_status is None:
        raise WorkflowStatusNotFoundError(
            "Default workflow status not found for project. Ensure workflow is seeded."
        )
    return default_status


def _next_issue_key(project_id: UUID) -> str:
    locked_project = Project.objects.select_for_update().get(pk=project_id)
    locked_project.next_issue_number += 1
    locked_project.save(update_fields=["next_issue_number"])
    return f"{locked_project.key}-{locked_project.next_issue_number}"


class IssueService:
    def create_issue(
        self,
        user,
        project_id: UUID,
        title: str,
        description: str | None = None,
        type: str = IssueType.TASK,
        priority: str = Priority.MEDIUM,
        sprint_id: UUID | None = None,
        assignee_id: UUID | None = None,
        label_ids: list[UUID] | None = None,
        due_date=None,
        estimate_hours: Decimal | float | None = None,
        story_points: int | None = None,
        parent_issue_id: UUID | None = None,
    ) -> Issue:
        project = _get_project_or_raise(project_id)
        _reject_archived_project(project)

        if not permission_service.can_edit_issue(user.id, project_id):
            raise IssueError("Permission denied: cannot create issues in this project.")

        normalized_title = title.strip()
        if not normalized_title:
            raise IssueValidationError("Title is required.")

        _validate_issue_type(type)
        _validate_priority(priority)
        _validate_parent_issue(project_id, type, parent_issue_id)

        if sprint_id is not None:
            require_scrum_project(project_id)
            _validate_sprint(project_id, sprint_id)

        labels = _validate_label_ids(project_id, label_ids or [])
        default_status = _resolve_default_status(project_id)

        with transaction.atomic():
            key = _next_issue_key(project_id)
            issue = Issue.objects.create(
                project_id=project_id,
                key=key,
                title=normalized_title,
                description=description or "",
                type=type,
                priority=priority,
                status_id=default_status.id,
                sprint_id=sprint_id,
                reporter_id=user.id,
                due_date=due_date,
                estimate_hours=estimate_hours,
                story_points=story_points,
                parent_issue_id=parent_issue_id,
            )
            if assignee_id is not None:
                issue.assignees.add(assignee_id)
            if labels:
                issue.labels.set(labels)

        return get_issue_by_id(issue.pk) or issue

    def update_issue(self, user, issue_id: UUID, **fields) -> Issue:
        issue = _get_issue_or_raise(issue_id)
        _reject_archived_project(issue.project)

        if not permission_service.can_edit_issue(user.id, issue.project_id):
            raise IssueError("Permission denied: cannot edit this issue.")

        forbidden = set(fields) & _FORBIDDEN_UPDATE_FIELDS
        if forbidden:
            raise IssueValidationError(
                f"Cannot update fields: {', '.join(sorted(forbidden))}."
            )

        unknown = set(fields) - _ALLOWED_UPDATE_FIELDS
        if unknown:
            raise IssueValidationError(
                f"Unknown or unsupported fields: {', '.join(sorted(unknown))}."
            )

        update_fields: list[str] = []
        label_ids = fields.pop("label_ids", fields.pop("labels", None))

        if "title" in fields:
            normalized_title = fields["title"].strip() if fields["title"] else ""
            if not normalized_title:
                raise IssueValidationError("Title cannot be empty.")
            issue.title = normalized_title
            update_fields.append("title")

        if "description" in fields:
            issue.description = fields["description"] or ""
            update_fields.append("description")

        if "type" in fields:
            _validate_issue_type(fields["type"])
            issue.type = fields["type"]
            update_fields.append("type")

        if "priority" in fields:
            _validate_priority(fields["priority"])
            issue.priority = fields["priority"]
            update_fields.append("priority")

        sprint_value = fields.get("sprint_id", fields.get("sprint"))
        if "sprint_id" in fields or "sprint" in fields:
            require_scrum_project(issue.project_id)
            if sprint_value is not None:
                _validate_sprint(issue.project_id, sprint_value)
            issue.sprint_id = sprint_value
            update_fields.append("sprint_id")

        old_assignee_id = issue.get_primary_assignee_id()
        assignee_value = fields.get("assignee_id", fields.get("assignee"))
        if "assignee_id" in fields or "assignee" in fields:
            issue.assignees.clear()
            if assignee_value is not None:
                issue.assignees.add(assignee_value)

        if "due_date" in fields:
            issue.due_date = fields["due_date"]
            update_fields.append("due_date")

        if "estimate_hours" in fields:
            issue.estimate_hours = fields["estimate_hours"]
            update_fields.append("estimate_hours")

        if "story_points" in fields:
            issue.story_points = fields["story_points"]
            update_fields.append("story_points")

        if update_fields:
            update_fields.append("updated_at")
            issue.save(update_fields=update_fields)

        if (
            ("assignee_id" in fields or "assignee" in fields)
            and old_assignee_id != assignee_value
        ):
            create_issue_activity(
                issue_id=issue.id,
                actor=user,
                event_type=IssueActivityEventType.ASSIGNEE_CHANGED,
                old_value=get_user_display_value(old_assignee_id),
                new_value=get_user_display_value(assignee_value),
            )
            if assignee_value is not None and assignee_value != user.id:
                notification_service.create_notification(
                    user_id=assignee_value,
                    actor_id=user.id,
                    event_type="assignee_changed",
                    title="Issue Assigned",
                    message=f"You were assigned to {issue.key}",
                    related_issue_id=issue.id,
                )

        if label_ids is not None:
            labels = _validate_label_ids(issue.project_id, label_ids)
            issue.labels.set(labels)

        refreshed = get_issue_by_id(issue_id)
        return refreshed or issue

    def create_subtask(self, user, parent_issue_id: UUID, title: str) -> Issue:
        parent = _get_issue_or_raise(parent_issue_id)
        _reject_archived_project(parent.project)

        if parent.type == IssueType.SUBTASK:
            raise IssueValidationError("Subtasks cannot have nested subtasks.")

        return self.create_issue(
            user=user,
            project_id=parent.project_id,
            title=title,
            type=IssueType.SUBTASK,
            parent_issue_id=parent_issue_id,
            sprint_id=parent.sprint_id,
        )

    def update_subtask(
        self,
        user,
        subtask_id: UUID,
        *,
        title: str | None = None,
        done: bool | None = None,
    ) -> Issue:
        issue = _get_issue_or_raise(subtask_id)
        _reject_archived_project(issue.project)

        if issue.type != IssueType.SUBTASK:
            raise IssueValidationError("Issue is not a subtask.")

        if not permission_service.can_edit_issue(user.id, issue.project_id):
            raise IssueError("Permission denied: cannot edit this issue.")

        update_fields: list[str] = []

        if title is not None:
            normalized_title = title.strip()
            if not normalized_title:
                raise IssueValidationError("Title cannot be empty.")
            issue.title = normalized_title
            update_fields.append("title")

        if done is not None:
            default_status = _resolve_default_status(issue.project_id)
            done_status = _get_done_status(issue.project_id)
            if done_status is None:
                raise WorkflowStatusNotFoundError(
                    "Done workflow status not found for project."
                )
            target_status = done_status if done else default_status
            if issue.status_id != target_status.id:
                previous_status_name = issue.status.name
                issue.status = target_status
                update_fields.extend(["status"])
                create_issue_activity(
                    issue_id=issue.id,
                    actor=user,
                    event_type=IssueActivityEventType.STATUS_CHANGED,
                    old_value=previous_status_name,
                    new_value=target_status.name,
                )

        if update_fields:
            update_fields.append("updated_at")
            issue.save(update_fields=update_fields)

        refreshed = get_issue_by_id(subtask_id)
        return refreshed or issue

    def assign_sprint(self, user, issue_id: UUID, sprint_id: UUID | None) -> Issue:
        issue = _get_issue_or_raise(issue_id)
        _reject_archived_project(issue.project)
        require_scrum_project(issue.project_id)

        if not permission_service.can_edit_issue(user.id, issue.project_id):
            raise IssueError("Permission denied: cannot edit this issue.")

        old_sprint_id = issue.sprint_id
        old_sprint_name = issue.sprint.name if issue.sprint is not None else None
        new_sprint_name = None
        if sprint_id is not None:
            new_sprint_name = _validate_sprint(issue.project_id, sprint_id).name

        issue.sprint_id = sprint_id
        issue.save(update_fields=["sprint_id", "updated_at"])

        if old_sprint_id != sprint_id:
            create_issue_activity(
                issue_id=issue.id,
                actor=user,
                event_type=IssueActivityEventType.SPRINT_CHANGED,
                old_value=old_sprint_name,
                new_value=new_sprint_name,
            )
            if (
                sprint_id is not None
                and issue.get_primary_assignee_id() is not None
                and issue.get_primary_assignee_id() != user.id
            ):
                notification_service.create_notification(
                    user_id=issue.get_primary_assignee_id(),
                    actor_id=user.id,
                    event_type="sprint_assigned",
                    title="Sprint Updated",
                    message=f"Issue moved to sprint {new_sprint_name}",
                    related_issue_id=issue.id,
                )

        refreshed = get_issue_by_id(issue_id)
        return refreshed or issue

    def bulk_assign_sprint(
        self,
        user,
        issue_ids: list[UUID],
        sprint_id: UUID | None,
    ) -> int:
        if not issue_ids:
            return 0

        issues = list(
            Issue.objects.filter(pk__in=issue_ids).select_related("project", "sprint").prefetch_related("assignees")
        )
        found_ids = {issue.id for issue in issues}
        missing = [issue_id for issue_id in issue_ids if issue_id not in found_ids]
        if missing:
            raise IssueNotFoundError(f"Issue '{missing[0]}' not found.")

        project_ids = {issue.project_id for issue in issues}
        if len(project_ids) > 1:
            raise IssueValidationError("All issues must belong to the same project.")

        project_id = next(iter(project_ids))
        require_scrum_project(project_id)
        target_sprint_name = None
        if sprint_id is not None:
            target_sprint_name = _validate_sprint(project_id, sprint_id).name

        for issue in issues:
            _reject_archived_project(issue.project)
            if not permission_service.can_edit_issue(user.id, issue.project_id):
                raise IssueError("Permission denied: cannot edit this issue.")

        with transaction.atomic():
            updated_count = Issue.objects.filter(pk__in=issue_ids).update(sprint_id=sprint_id)
            for issue in issues:
                if issue.sprint_id == sprint_id:
                    continue
                old_sprint_name = issue.sprint.name if issue.sprint is not None else None
                create_issue_activity(
                    issue_id=issue.id,
                    actor=user,
                    event_type=IssueActivityEventType.SPRINT_CHANGED,
                    old_value=old_sprint_name,
                    new_value=target_sprint_name,
                )
                assignee_id = issue.get_primary_assignee_id()
                if (
                    sprint_id is not None
                    and assignee_id is not None
                    and assignee_id != user.id
                ):
                    notification_service.create_notification(
                        user_id=assignee_id,
                        actor_id=user.id,
                        event_type="sprint_assigned",
                        title="Sprint Updated",
                        message=f"Issue moved to sprint {target_sprint_name}",
                        related_issue_id=issue.id,
                    )
            return updated_count

    def delete_issue(self, user, issue_id: UUID) -> bool:
        issue = _get_issue_or_raise(issue_id)
        _reject_archived_project(issue.project)

        if not permission_service.can_edit_issue(user.id, issue.project_id):
            raise IssueError("Permission denied: cannot delete this issue.")

        if issue.type != IssueType.SUBTASK:
            has_open_subtasks = any(
                not _issue_is_done(subtask)
                for subtask in Issue.objects.filter(
                    parent_issue_id=issue.id,
                    type=IssueType.SUBTASK,
                ).select_related("status")
            )
            if has_open_subtasks:
                raise IssueValidationError(
                    "Cannot delete issue with open subtasks."
                )

        issue.soft_delete(user)
        return True


issue_service = IssueService()
