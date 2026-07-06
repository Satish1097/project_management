from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.foundation.responses import success_response
from apps.issues.selectors import select_sprint_activity_feed
from apps.permissions.drf_permissions import Authenticated, CanManageSprint, CanPlanSprint, CanViewProject
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.projects.services.project_service import require_scrum_project
from apps.sprints.api.serializers import (
    SprintCompleteSerializer,
    SprintCreateSerializer,
    SprintUpdateSerializer,
)
from apps.sprints.exceptions import SprintNotFoundError
from apps.sprints.selectors import (
    _sprint_health_queryset,
    get_project_sprint_by_id,
    get_project_sprints_with_health,
    get_sprint_metrics,
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

    if include_health and hasattr(sprint, "total_issues"):
        data["total_issues"] = sprint.total_issues or 0
        data["completed_issues"] = sprint.completed_issues or 0
        data["remaining_issues"] = (sprint.total_issues or 0) - (sprint.completed_issues or 0)
        data["in_progress_issues"] = sprint.in_progress_issues or 0
        total = sprint.total_issues or 0
        completed = sprint.completed_issues or 0
        data["progress_percentage"] = round((completed / total) * 100) if total > 0 else 0
        data["issue_count"] = data["total_issues"]
        data["completed_issue_count"] = data["completed_issues"]
    elif include_health:
        metrics = get_sprint_metrics(sprint.id)
        if metrics is not None:
            data.update(metrics)
            data["issue_count"] = metrics["total_issues"]
            data["completed_issue_count"] = metrics["completed_issues"]

    return data


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _require_project_sprint(project_id: UUID, sprint_id: UUID):
    sprint = get_project_sprint_by_id(project_id=project_id, sprint_id=sprint_id)
    if sprint is None:
        raise SprintNotFoundError(f"Sprint '{sprint_id}' not found in project '{project_id}'.")
    return sprint


def _sprint_with_health(project_id: UUID, sprint_id: UUID):
    return (
        _sprint_health_queryset()
        .filter(project_id=project_id, pk=sprint_id)
        .first()
    )


class ProjectSprintListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanPlanSprint()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id: UUID):
        _require_project(project_id)
        require_scrum_project(project_id)
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
        sprint = _sprint_with_health(project_id, sprint.id) or sprint
        return success_response(data={"sprint": _sprint_to_data(sprint, include_health=True)}, status=201)


class ProjectSprintDetailView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [Authenticated(), CanManageSprint()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        require_scrum_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = (
            _sprint_with_health(project_id, sprint_id)
        )
        return success_response(
            data={"sprint": _sprint_to_data(sprint, include_health=True)},
        )

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
        sprint = _sprint_with_health(project_id, sprint.id) or sprint
        return success_response(data={"sprint": _sprint_to_data(sprint, include_health=True)})


class SprintStartView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.start_sprint(user=request.user, sprint_id=sprint_id)
        sprint = _sprint_with_health(project_id, sprint.id) or sprint
        return success_response(data={"sprint": _sprint_to_data(sprint, include_health=True)})


class SprintPauseView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.pause_sprint(user=request.user, sprint_id=sprint_id)
        sprint = _sprint_with_health(project_id, sprint.id) or sprint
        return success_response(data={"sprint": _sprint_to_data(sprint, include_health=True)})


class SprintResumeView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        sprint = sprint_service.resume_sprint(user=request.user, sprint_id=sprint_id)
        sprint = _sprint_with_health(project_id, sprint.id) or sprint
        return success_response(data={"sprint": _sprint_to_data(sprint, include_health=True)})


class SprintCompleteView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(request=SprintCompleteSerializer, tags=["sprints"])
    def post(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        serializer = SprintCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sprint = sprint_service.complete_sprint(
            user=request.user,
            sprint_id=sprint_id,
            move_incomplete_to=serializer.validated_data.get(
                "move_incomplete_to", "backlog"
            ),
            target_sprint_id=serializer.validated_data.get("target_sprint_id"),
        )
        sprint = _sprint_with_health(project_id, sprint.id) or sprint
        return success_response(data={"sprint": _sprint_to_data(sprint, include_health=True)})


class SprintActivityView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        require_scrum_project(project_id)
        _require_project_sprint(project_id=project_id, sprint_id=sprint_id)
        activities = select_sprint_activity_feed(
            request.user.id,
            project_id=project_id,
            sprint_id=sprint_id,
        )
        return success_response(data={"activities": activities})
