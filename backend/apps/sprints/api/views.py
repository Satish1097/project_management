from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.contracts.sprint_contract import (
    SprintDetailDTO,
    SprintSummaryDTO,
    get_sprint_by_id,
    list_sprints_for_project,
)
from apps.foundation.responses import success_response
from apps.permissions.drf_permissions import (
    Authenticated,
    CanManageSprint,
    CanPlanSprint,
    CanViewProject,
    CanViewSprintProject,
)
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.sprints.api.serializers import (
    SprintBulkMoveSerializer,
    SprintCompleteSerializer,
    SprintCreateSerializer,
    SprintUpdateSerializer,
)
from apps.sprints.exceptions import SprintNotFoundError
from apps.sprints.services.sprint_service import (
    bulk_move_issues,
    complete_sprint,
    create_sprint,
    start_sprint,
    update_sprint,
)


def _sprint_summary_to_data(dto: SprintSummaryDTO) -> dict:
    return {
        "id": str(dto.id),
        "project_id": str(dto.project_id),
        "name": dto.name,
        "status": dto.status,
        "start_date": dto.start_date.isoformat() if dto.start_date else None,
        "end_date": dto.end_date.isoformat() if dto.end_date else None,
    }


def _sprint_detail_to_data(dto: SprintDetailDTO) -> dict:
    data = _sprint_summary_to_data(dto)
    data.update(
        {
            "goal": dto.goal,
            "started_at": dto.started_at.isoformat() if dto.started_at else None,
            "completed_at": dto.completed_at.isoformat() if dto.completed_at else None,
        }
    )
    return data


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _require_sprint(sprint_id: UUID) -> SprintDetailDTO:
    sprint = get_sprint_by_id(sprint_id)
    if sprint is None:
        raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")
    return sprint


class ProjectSprintListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanPlanSprint()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["sprints"])
    def get(self, request, project_id):
        _require_project(project_id)
        sprints = list_sprints_for_project(project_id)
        return success_response(data={"sprints": [_sprint_summary_to_data(s) for s in sprints]})

    @extend_schema(request=SprintCreateSerializer, tags=["sprints"])
    def post(self, request, project_id):
        _require_project(project_id)
        serializer = SprintCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sprint = create_sprint(project_id=project_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"sprint": _sprint_detail_to_data(sprint)}, status=201)


class SprintDetailView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [Authenticated(), CanManageSprint()]
        return [Authenticated(), CanViewSprintProject()]

    @extend_schema(tags=["sprints"])
    def get(self, request, sprint_id):
        sprint = _require_sprint(sprint_id)
        return success_response(data={"sprint": _sprint_detail_to_data(sprint)})

    @extend_schema(request=SprintUpdateSerializer, tags=["sprints"])
    def patch(self, request, sprint_id):
        _require_sprint(sprint_id)
        serializer = SprintUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        sprint = update_sprint(sprint_id=sprint_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"sprint": _sprint_detail_to_data(sprint)})


class SprintStartView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(tags=["sprints"])
    def post(self, request, sprint_id):
        _require_sprint(sprint_id)
        sprint = start_sprint(sprint_id=sprint_id, actor_id=request.user.id)
        return success_response(data={"sprint": _sprint_detail_to_data(sprint)})


class SprintCompleteView(APIView):
    permission_classes = [Authenticated, CanManageSprint]

    @extend_schema(request=SprintCompleteSerializer, tags=["sprints"])
    def post(self, request, sprint_id):
        _require_sprint(sprint_id)
        serializer = SprintCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sprint = complete_sprint(sprint_id=sprint_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"sprint": _sprint_detail_to_data(sprint)})


class SprintMoveIssuesView(APIView):
    permission_classes = [Authenticated, CanPlanSprint]

    @extend_schema(request=SprintBulkMoveSerializer, tags=["sprints"])
    def post(self, request, sprint_id):
        _require_sprint(sprint_id)
        serializer = SprintBulkMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        count = bulk_move_issues(
            sprint_id=sprint_id,
            actor_id=request.user.id,
            issue_ids=data["issue_ids"],
            target_sprint_id=data.get("sprint_id"),
        )
        return success_response(data={"moved_count": count})
