from uuid import UUID

from apps.issues.exceptions import IssueNotFoundError
from apps.issues.selectors import get_issue_by_id
from apps.permissions.services import permission_service
from apps.workflow.exceptions import (
    ForbiddenWorkflowTransitionError,
    InvalidWorkflowTransitionError,
    WorkflowStatusNotFoundError,
)
from apps.workflow.models import WorkflowTransition
from apps.workflow.selectors import get_status_by_id


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
        ):
            raise InvalidWorkflowTransitionError(
                "Transition is not defined for this project workflow."
            )

        issue.status = target_status
        issue.save(update_fields=["status", "updated_at"])

        return get_issue_by_id(issue_id) or issue


transition_service = TransitionService()
