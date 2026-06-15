from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.contracts.identity_contract import get_users_by_ids
from apps.contracts.issue_contract import (
    IssueDetailDTO,
    IssueKanbanDTO,
    IssueSummaryDTO,
    get_issue_by_id,
    get_issues_for_project,
)
from apps.contracts.workflow_contract import get_workflow_config
from apps.foundation.responses import success_response
from apps.issues.api.serializers import (
    IssueAssignSerializer,
    IssueCreateSerializer,
    IssueMoveSprintSerializer,
    IssueTransitionSerializer,
    IssueUpdateSerializer,
)
from apps.issues.exceptions import IssueNotFoundError
from apps.issues.services.issue_service import (
    assign_issue,
    create_issue,
    move_issue_to_sprint,
    transition_issue,
    update_issue,
)
from apps.issues.selectors import select_backlog_issues, select_kanban_board
from apps.permissions.drf_permissions import (
    Authenticated,
    CanAssignIssue,
    CanCreateIssue,
    CanEditIssue,
    CanPlanSprint,
    CanTransitionIssue,
    CanViewIssueProject,
    CanViewProject,
    CanViewSprintBoard,
)
from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.workflow.exceptions import WorkflowStatusNotFoundError


def _statuses_by_slug(project_id: UUID) -> dict:
    config = get_workflow_config(project_id)
    return {status.slug: status for status in config.statuses}


def _user_ref(user_id: UUID | None, users_by_id: dict) -> dict | None:
    if user_id is None:
        return None
    user = users_by_id.get(user_id)
    if user is None:
        return {"id": str(user_id)}
    return {"id": str(user.id), "display_name": user.display_name}


def _issue_summary_to_data(dto: IssueSummaryDTO) -> dict:
    return {
        "id": str(dto.id),
        "key": dto.key,
        "title": dto.title,
        "issue_type": dto.issue_type,
        "priority": dto.priority,
        "status_slug": dto.status_slug,
        "position": str(dto.position),
        "assignee_id": str(dto.assignee_id) if dto.assignee_id else None,
        "sprint_id": str(dto.sprint_id) if dto.sprint_id else None,
    }


def _issue_detail_to_data(dto: IssueDetailDTO) -> dict:
    statuses = _statuses_by_slug(dto.project_id)
    status = statuses.get(dto.status_slug)
    users = get_users_by_ids(
        [uid for uid in (dto.reporter_id, dto.assignee_id) if uid is not None]
    )
    users_by_id = {user.id: user for user in users}
    data = _issue_summary_to_data(dto)
    data.update(
        {
            "description": dto.description,
            "status": {
                "id": str(status.id),
                "slug": status.slug,
                "name": status.name,
            }
            if status
            else {"slug": dto.status_slug},
            "reporter": _user_ref(dto.reporter_id, users_by_id),
            "assignee": _user_ref(dto.assignee_id, users_by_id),
            "parent_issue_id": str(dto.parent_issue_id) if dto.parent_issue_id else None,
            "story_points": dto.story_points,
            "due_date": dto.due_date.isoformat() if dto.due_date else None,
            "labels": list(dto.labels),
            "created_at": dto.created_at.isoformat(),
            "updated_at": dto.updated_at.isoformat(),
        }
    )
    return data


def _kanban_to_data(dto: IssueKanbanDTO) -> dict:
    return {
        "project_id": str(dto.project_id),
        "columns": [
            {
                "status_slug": column.status_slug,
                "status_name": column.status_name,
                "issues": [_issue_summary_to_data(issue) for issue in column.issues],
            }
            for column in dto.columns
        ],
    }


def _require_issue(issue_id: UUID) -> IssueDetailDTO:
    issue = get_issue_by_id(issue_id)
    if issue is None:
        raise IssueNotFoundError(f"Issue '{issue_id}' not found.")
    return issue


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _status_slug_for_id(project_id: UUID, status_id: UUID) -> str:
    for status in get_workflow_config(project_id).statuses:
        if status.id == status_id:
            return status.slug
    raise WorkflowStatusNotFoundError(
        f"Status '{status_id}' not found for project '{project_id}'."
    )


class ProjectIssueListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanCreateIssue()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id):
        _require_project(project_id)
        issues = get_issues_for_project(project_id)
        return success_response(data={"issues": [_issue_summary_to_data(i) for i in issues]})

    @extend_schema(request=IssueCreateSerializer, tags=["issues"])
    def post(self, request, project_id):
        _require_project(project_id)
        serializer = IssueCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = create_issue(project_id=project_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"issue": _issue_detail_to_data(issue)}, status=201)


class IssueDetailView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [Authenticated(), CanEditIssue()]
        return [Authenticated(), CanViewIssueProject()]

    @extend_schema(tags=["issues"])
    def get(self, request, issue_id):
        issue = _require_issue(issue_id)
        return success_response(data={"issue": _issue_detail_to_data(issue)})

    @extend_schema(request=IssueUpdateSerializer, tags=["issues"])
    def patch(self, request, issue_id):
        _require_issue(issue_id)
        serializer = IssueUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        issue = update_issue(issue_id=issue_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"issue": _issue_detail_to_data(issue)})


class IssueAssignView(APIView):
    permission_classes = [Authenticated, CanAssignIssue]

    @extend_schema(request=IssueAssignSerializer, tags=["issues"])
    def post(self, request, issue_id):
        _require_issue(issue_id)
        serializer = IssueAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = assign_issue(issue_id=issue_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"issue": _issue_detail_to_data(issue)})


class IssueTransitionView(APIView):
    permission_classes = [Authenticated, CanTransitionIssue]

    @extend_schema(request=IssueTransitionSerializer, tags=["issues"])
    def post(self, request, issue_id):
        issue = _require_issue(issue_id)
        serializer = IssueTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        slug = _status_slug_for_id(issue.project_id, serializer.validated_data["target_status_id"])
        issue = transition_issue(issue_id=issue_id, to_status_slug=slug, actor_id=request.user.id)
        return success_response(data={"issue": _issue_detail_to_data(issue)})


class IssueMoveSprintView(APIView):
    permission_classes = [Authenticated, CanPlanSprint]

    @extend_schema(request=IssueMoveSprintSerializer, tags=["issues"])
    def post(self, request, issue_id):
        _require_issue(issue_id)
        serializer = IssueMoveSprintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = move_issue_to_sprint(issue_id=issue_id, actor_id=request.user.id, **serializer.validated_data)
        return success_response(data={"issue": _issue_detail_to_data(issue)})


class ProjectBacklogView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id):
        _require_project(project_id)
        issues = select_backlog_issues(project_id)
        return success_response(data={"issues": [_issue_summary_to_data(i) for i in issues]})


class ProjectKanbanView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id):
        _require_project(project_id)
        raw_sprint_id = request.query_params.get("sprint_id")
        sprint_id = UUID(raw_sprint_id) if raw_sprint_id else None
        board = select_kanban_board(project_id, sprint_id=sprint_id)
        return success_response(data={"board": _kanban_to_data(board)})


class SprintBoardView(APIView):
    permission_classes = [Authenticated, CanViewSprintBoard]

    @extend_schema(tags=["issues"])
    def get(self, request, sprint_id):
        from apps.contracts.sprint_contract import get_sprint_by_id
        from apps.sprints.exceptions import SprintNotFoundError

        sprint = get_sprint_by_id(sprint_id)
        if sprint is None:
            raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")
        board = select_kanban_board(sprint.project_id, sprint_id=sprint_id)
        return success_response(data={"board": _kanban_to_data(board)})
