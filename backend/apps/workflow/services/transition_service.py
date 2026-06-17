from uuid import UUID

from apps.issues.exceptions import IssueNotFoundError
from apps.issues.models import IssueActivityEventType
from apps.issues.selectors import get_issue_by_id
from apps.issues.services.activity_service import create_issue_activity
from apps.notifications.services import notification_service
from apps.permissions.services import permission_service
from apps.workflow.exceptions import (
    ForbiddenWorkflowTransitionError,
    InvalidWorkflowTransitionError,
    WorkflowStatusNotFoundError,
)
from apps.workflow.models import WorkflowStatus, WorkflowTransition
from apps.workflow.selectors import get_status_by_id
from apps.workflow.slug_utils import status_slug

KANBAN_DIRECT_TRANSITIONS = frozenset(
    {
        ("in_progress", "done"),
        ("done", "in_progress"),
    }
)


def _status_slug(status: WorkflowStatus) -> str:
    return status_slug(name=status.name, category=status.category)


class TransitionService:
    def validate_transition(
        self,
        project_id: UUID,
        from_status_id: UUID,
        to_status_id: UUID,
    ) -> bool:
        return WorkflowTransition.objects.filter(
            project_id=project_id,
            from_status_id=from_status_id,
            to_status_id=to_status_id,
        ).exists()

    def validate_kanban_transition(
        self,
        from_status: WorkflowStatus,
        to_status: WorkflowStatus,
    ) -> bool:
        return (_status_slug(from_status), _status_slug(to_status)) in KANBAN_DIRECT_TRANSITIONS

    def transition_issue(
        self,
        user,
        issue_id: UUID,
        to_status_id: UUID,
    ):
        issue = get_issue_by_id(issue_id)
        if issue is None:
            raise IssueNotFoundError(f"Issue '{issue_id}' not found.")

        target_status = get_status_by_id(to_status_id)
        if target_status is None:
            raise WorkflowStatusNotFoundError(
                f"Workflow status '{to_status_id}' not found."
            )

        if issue.project_id != target_status.project_id:
            raise InvalidWorkflowTransitionError(
                "Target status must belong to the same project as the issue."
            )

        if not permission_service.can_transition_issue(user.id, issue.project_id):
            raise ForbiddenWorkflowTransitionError(
                "Permission denied: cannot transition this issue."
            )

        if issue.status_id == target_status.id:
            raise InvalidWorkflowTransitionError("Self-transition is not allowed.")

        if not self.validate_transition(
            project_id=issue.project_id,
            from_status_id=issue.status_id,
            to_status_id=target_status.id,
        ) and not self.validate_kanban_transition(issue.status, target_status):
            raise InvalidWorkflowTransitionError(
                "Transition is not defined for this project workflow."
            )

        previous_status_name = issue.status.name
        issue.status = target_status
        issue.save(update_fields=["status", "updated_at"])
        create_issue_activity(
            issue_id=issue.id,
            actor=user,
            event_type=IssueActivityEventType.STATUS_CHANGED,
            old_value=previous_status_name,
            new_value=target_status.name,
        )
        if issue.assignee_id is not None and issue.assignee_id != user.id:
            notification_service.create_notification(
                user_id=issue.assignee_id,
                actor_id=user.id,
                event_type="status_changed",
                title="Status Updated",
                message=f"{previous_status_name} → {target_status.name}",
                related_issue_id=issue.id,
            )

        return get_issue_by_id(issue_id) or issue


transition_service = TransitionService()
