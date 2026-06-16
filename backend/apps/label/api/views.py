from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.foundation.responses import success_response
from apps.label.api.serializers import (
    LabelCreateSerializer,
    LabelSerializer,
    LabelUpdateSerializer,
)
from apps.label.selectors import get_project_labels
from apps.label.services.label_service import label_service
from apps.permissions.drf_permissions import Authenticated, CanEditProject, CanViewProject
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


class ProjectLabelListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanEditProject()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["labels"])
    def get(self, request, project_id):
        _require_project(project_id)
        labels = get_project_labels(project_id)
        return success_response(data={"labels": LabelSerializer(labels, many=True).data})

    @extend_schema(request=LabelCreateSerializer, tags=["labels"])
    def post(self, request, project_id):
        _require_project(project_id)
        serializer = LabelCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        label = label_service.create_label(
            user=request.user,
            project_id=project_id,
            **serializer.validated_data,
        )
        return success_response(data={"label": LabelSerializer(label).data}, status=201)


class ProjectLabelDetailView(APIView):
    permission_classes = [Authenticated, CanEditProject]

    @extend_schema(request=LabelUpdateSerializer, tags=["labels"])
    def patch(self, request, project_id, label_id):
        _require_project(project_id)
        serializer = LabelUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        label = label_service.update_label(
            user=request.user,
            label_id=label_id,
            **serializer.validated_data,
        )
        return success_response(data={"label": LabelSerializer(label).data})

    @extend_schema(tags=["labels"])
    def delete(self, request, project_id, label_id):
        _require_project(project_id)
        label = label_service.archive_label(user=request.user, label_id=label_id)
        return success_response(data={"label": LabelSerializer(label).data})
