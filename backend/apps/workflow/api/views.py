from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.contracts.workflow_contract import WorkflowConfigDTO, get_workflow_config
from apps.foundation.responses import success_response
from apps.permissions.drf_permissions import Authenticated, CanViewProject
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id


def _workflow_to_data(dto: WorkflowConfigDTO) -> dict:
    return {
        "project_id": str(dto.project_id),
        "statuses": [
            {
                "id": str(status.id),
                "slug": status.slug,
                "name": status.name,
                "category": status.category,
                "order": status.position,
            }
            for status in dto.statuses
        ],
        "transitions": [
            {
                "id": str(transition.id),
                "from_status_slug": transition.from_status_slug,
                "to_status_slug": transition.to_status_slug,
                "name": transition.name,
            }
            for transition in dto.transitions
        ],
    }


class ProjectWorkflowView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["workflow"])
    def get(self, request, project_id: UUID):
        if select_project_by_id(project_id) is None:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
        config = get_workflow_config(project_id)
        return success_response(data={"workflow": _workflow_to_data(config)})
