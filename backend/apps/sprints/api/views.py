from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.foundation.responses import success_response
from apps.issues.selectors import select_sprint_activity_feed
from apps.permissions.drf_permissions import Authenticated, CanManageSprint, CanPlanSprint, CanViewProject
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.sprints.api.serializers import SprintCreateSerializer, SprintUpdateSerializer
from apps.sprints.exceptions import SprintNotFoundError
from apps.sprints.selectors import (
    get_project_sprint_by_id,
    get_project_sprints_with_health,
    select_project_sprint_health,
)
from apps.sprints.services.sprint_service import sprint_service


def _sprint_to_data(sprint, include_health: bool = False) -> dict:
    capacity_points = None
    if "capacity_points" not in sprint.get_deferred_fields():
        capacity_points = sprint.capacity_points

    data = {
        "id": str(sprint.id),
        "project_id": str(sprint.project_id),
        "name": sprint.name,
        "goal": sprint.goal,
        "status": sprint.status,
        "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
        "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
        "capacity_points": capacity_points,
        "created_at": sprint.created_at.isoformat() if sprint.created_at else None,
        "updated_at": sprint.updated_at.isoformat() if sprint.updated_at else None,
    }

    # Include issue counts if sprint has health annotations
    if include_health and hasattr(sprint, "issue_count"):
        data["issue_count"] = sprint.issue_count or 0
        data["completed_issue_count"] = sprint.completed_issue_count or 0

    return data


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _require_project_sprint(project_id: UUID, sprint_id: UUID):
    sprint = get_project_sprint_by_id(project_id=project_id, sprint_id=sprint_id)
    if sprint is None:
        raise SprintNotFoundError(f"Sprint '{sprint_id}' not found in project '{project_id}'.")
    return sprint


class ProjectSprintListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanPlanSprint()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id: UUID):
        _require_project(project_id)
        sprints = get_project_sprints_with_health(project_id)
        return success_response(data={"sprints": [_sprint_to_data(sprint, include_health=True) for sprint in sprints]})

    @extend_schema(request=SprintCreateSerializer, tags=["sprints"])
    def post(self, request, project_id: UUID):
        _require_project(project_id)
        serializer = SprintCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sprint = sprint_service.create_sprint(
            user=request.user,
            project_id=project_id,
            **serializer.validated_data,
        )
        return success_response(data={"sprint": _sprint_to_data(sprint)}, status=201)


class ProjectSprintDetailView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [Authenticated(), CanManageSprint()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        sprint = _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        return success_response(data={"sprint": _sprint_to_data(sprint)})

    @extend_schema(request=SprintUpdateSerializer, tags=["sprints"])
    def patch(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        serializer = SprintUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sprint = sprint_service.update_sprint(
            user=request.user,
            sprint_id=sprint_id,
            **serializer.validated_data,
        )
        return success_response(data={"sprint": _sprint_to_data(sprint)})


class SprintStartView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.start_sprint(user=request.user, sprint_id=sprint_id)
        return success_response(data={"sprint": _sprint_to_data(sprint)})


class SprintPauseView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.pause_sprint(user=request.user, sprint_id=sprint_id)
        return success_response(data={"sprint": _sprint_to_data(sprint)})


class SprintResumeView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.resume_sprint(user=request.user, sprint_id=sprint_id)
        return success_response(data={"sprint": _sprint_to_data(sprint)})


class SprintCompleteView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.complete_sprint(user=request.user, sprint_id=sprint_id)
        return success_response(data={"sprint": _sprint_to_data(sprint)})


class SprintActivityView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        activities = select_sprint_activity_feed(
            request.user.id,
            project_id=project_id,
            sprint_id=sprint_id,
        )
        return success_response(data={"activities": activities})
