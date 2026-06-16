from uuid import UUID

from apps.workflow.models import WorkflowTransition


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


transition_service = TransitionService()
