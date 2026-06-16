from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from apps.foundation.responses import success_response
from apps.permissions.drf_permissions import Authenticated, CanViewProject
from apps.permissions.services import permission_service
from apps.projects.exceptions import ProjectAccessDeniedError
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.workflow.selectors import get_project_workflow, select_workflow_config
from apps.workflow.services import workflow_config_service


class WorkflowStatusPayloadSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    temp_id = serializers.CharField(required=False)
    name = serializers.CharField()
    category = serializers.CharField()
    order = serializers.IntegerField(min_value=0)
    color = serializers.CharField(required=False, allow_blank=True)
    is_default = serializers.BooleanField(required=False)


class WorkflowTransitionPayloadSerializer(serializers.Serializer):
    from_status_id = serializers.CharField()
    to_status_id = serializers.CharField()
    name = serializers.CharField(required=False, allow_blank=True)


class WorkflowUpdateRequestSerializer(serializers.Serializer):
    statuses = WorkflowStatusPayloadSerializer(many=True)
    transitions = WorkflowTransitionPayloadSerializer(many=True)


class WorkflowReadSerializer(serializers.Serializer):
    scheme_name = serializers.CharField(allow_null=True)
    statuses = serializers.ListField()
    transitions = serializers.ListField()


class WorkflowUpdateResponseSerializer(serializers.Serializer):
    project_id = serializers.CharField()
    statuses = serializers.ListField()
    transitions = serializers.ListField()


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _workflow_to_data(project_id: UUID) -> dict:
    scheme = get_project_workflow(project_id)
    config = select_workflow_config(project_id)
    return {
        "scheme_name": scheme.name if scheme is not None else None,
        "statuses": [
            {
                "id": str(status.id),
                "slug": status.slug,
                "name": status.name,
                "category": status.category,
                "order": status.position,
                "is_default": status.is_default,
                "is_terminal": status.is_terminal,
            }
            for status in config.statuses
        ],
        "transitions": [
            {
                "id": str(transition.id),
                "from_status_slug": transition.from_status_slug,
                "to_status_slug": transition.to_status_slug,
                "name": transition.name,
                "requires_approval": transition.requires_approval,
            }
            for transition in config.transitions
        ],
    }


class ProjectWorkflowView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "GET":
            return [Authenticated(), CanViewProject()]
        return [Authenticated()]

    @extend_schema(responses=WorkflowReadSerializer, tags=["workflow"])
    def get(self, request, project_id: UUID):
        _require_project(project_id)
        serializer = WorkflowReadSerializer(_workflow_to_data(project_id))
        return success_response(data={"workflow": serializer.data})

    @extend_schema(
        request=WorkflowUpdateRequestSerializer,
        responses=WorkflowUpdateResponseSerializer,
        tags=["workflow"],
    )
    def put(self, request, project_id: UUID):
        _require_project(project_id)
        if not permission_service.can_manage_workflow(request.user.id, project_id):
            raise ProjectAccessDeniedError("You cannot manage workflow for this project.")

        serializer = WorkflowUpdateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        try:
            normalized = workflow_config_service.update_workflow(
                user=request.user,
                project_id=project_id,
                statuses=payload["statuses"],
                transitions=payload["transitions"],
            )
        except ValueError as exc:
            raise ValidationError({"workflow": str(exc)}) from exc

        response_serializer = WorkflowUpdateResponseSerializer(normalized)
        return success_response(data={"workflow": response_serializer.data})
