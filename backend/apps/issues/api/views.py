from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from apps.foundation.pagination import IssueListPagination
from apps.foundation.responses import success_response
from apps.issues.api.serializers import (
    AttachmentSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    CommentUpdateSerializer,
    IssueActivitySerializer,
    IssueCreateSerializer,
    IssueMoveSprintSerializer,
    IssueSerializer,
    IssueTransitionSerializer,
    IssueUpdateSerializer,
    SubtaskCreateSerializer,
    SubtaskSerializer,
    SubtaskUpdateSerializer,
)
from apps.issues.kanban_constants import DEFAULT_KANBAN_PAGE_SIZE, MAX_KANBAN_PAGE_SIZE
from apps.issues.selectors import (
    BoardFilterParams,
    get_board_column_issues,
    get_issue_activity,
    get_issue_attachments,
    get_issue_by_id,
    get_issue_comments,
    get_issue_subtasks,
    get_kanban_board_filters,
    get_project_board_metadata,
    get_project_issues,
    get_project_kanban,
    get_sprint_board_metadata,
    get_sprint_kanban,
)
from apps.sprints.exceptions import SprintNotFoundError
from apps.sprints.selectors import get_project_sprint_by_id
from apps.issues.services import attachment_service, comment_service, issue_service
from apps.permissions.drf_permissions import Authenticated
from apps.permissions.services import permission_service
from apps.projects.exceptions import ProjectAccessDeniedError, ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.sprints.api.serializers import SprintSerializer
from apps.workflow.api.serializers import WorkflowStatusSerializer
from apps.workflow.services import transition_service
from apps.workflow.slug_utils import status_slug


class IssueBulkAssignSprintSerializer(serializers.Serializer):
    issue_ids = serializers.ListField(child=serializers.UUIDField(), allow_empty=False)
    sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)


def _parse_uuid(value: str | None) -> UUID | None:
    if not value:
        return None
    return UUID(value)


def _require_project(project_id: UUID) -> None:
    if select_project_by_id(project_id) is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")


def _require_issue_view(user_id: UUID, project_id: UUID) -> None:
    if not permission_service.can_view_issue(user_id, project_id):
        raise ProjectAccessDeniedError("You cannot view this project.")


def _require_issue(issue_id: UUID):
    issue = get_issue_by_id(issue_id)
    if issue is None:
        raise IssueNotFoundError(f"Issue '{issue_id}' not found.")
    return issue


def _create_kwargs(validated_data: dict) -> dict:
    return {
        "title": validated_data["title"],
        "description": validated_data.get("description"),
        "type": validated_data.get("type"),
        "priority": validated_data.get("priority"),
        "sprint_id": validated_data.get("sprint"),
        "assignee_id": validated_data.get("assignee"),
        "label_ids": validated_data.get("labels"),
        "due_date": validated_data.get("due_date"),
        "estimate_hours": validated_data.get("estimate_hours"),
        "story_points": validated_data.get("story_points"),
        "parent_issue_id": validated_data.get("parent_issue"),
    }


def _kanban_sprint_data(sprint) -> dict | None:
    if sprint is None:
        return None
    return dict(SprintSerializer(sprint).data)


def _kanban_status_data(status) -> dict:
    data = dict(WorkflowStatusSerializer(status).data)
    data["slug"] = status_slug(name=status.name, category=status.category)
    return data


def _kanban_issue_data(issue, status_data: dict) -> dict:
    data = dict(IssueSerializer(issue).data)
    status = dict(data.get("status") or {})
    status["slug"] = status_data["slug"]
    data["status"] = status
    return data


def _kanban_column_data(column: dict) -> dict:
    status = _kanban_status_data(column["status"])
    return {
        "id": str(status["id"]),
        "status_id": str(status["id"]),
        "status_slug": status["slug"],
        "name": status["name"],
        "status": status,
        "count": column.get("count", len(column.get("issues", []))),
    }


def _kanban_board_data(project_id: UUID, board: dict) -> dict:
    columns = [_kanban_column_data(column) for column in board["columns"]]
    selected_sprint = _kanban_sprint_data(board["sprint"])

    return {
        "project_id": str(project_id),
        "selected_sprint": selected_sprint,
        "sprint": selected_sprint,
        "workflow_columns": [column["status"] for column in columns],
        "columns": columns,
        "filters": get_kanban_board_filters(project_id),
    }


def _parse_board_filter_params(request, user_id: UUID) -> BoardFilterParams:
    assignee_param = request.query_params.get("assignee")
    assignee_is_null = assignee_param is not None and assignee_param.lower() == "unassigned"
    assignee_id = None
    if assignee_param and assignee_param.lower() == "me":
        assignee_id = user_id
    elif not assignee_is_null and assignee_param:
        assignee_id = _parse_uuid(assignee_param)

    label_params = [
        value.strip() for value in request.query_params.getlist("label") if value.strip()
    ]
    labels_csv = request.query_params.get("labels")
    if labels_csv:
        label_params.extend(
            value.strip() for value in labels_csv.split(",") if value.strip()
        )
    labels = label_params or None

    due_date = request.query_params.get("dueDate") or request.query_params.get("due_date")

    return BoardFilterParams(
        assignee_id=assignee_id,
        assignee_is_null=assignee_is_null,
        status_id=_parse_uuid(request.query_params.get("status")),
        priority=request.query_params.get("priority") or None,
        labels=labels,
        search=request.query_params.get("search") or None,
        due_date=due_date or None,
    )


def _parse_board_pagination(request) -> tuple[int, int]:
    page_raw = request.query_params.get("page", "1")
    page_size_raw = request.query_params.get("page_size", str(DEFAULT_KANBAN_PAGE_SIZE))
    try:
        page = max(1, int(page_raw))
    except (TypeError, ValueError):
        page = 1
    try:
        page_size = min(max(1, int(page_size_raw)), MAX_KANBAN_PAGE_SIZE)
    except (TypeError, ValueError):
        page_size = DEFAULT_KANBAN_PAGE_SIZE
    return page, page_size


def _kanban_column_issues_data(column_page: dict) -> dict:
    status = _kanban_status_data(column_page["status"])
    issues = [_kanban_issue_data(issue, status) for issue in column_page["issues"]]
    return {
        "page": column_page["page"],
        "page_size": column_page["page_size"],
        "total": column_page["total"],
        "has_next": column_page["has_next"],
        "issues": issues,
    }


class IssueListCreateView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=IssueSerializer(many=True), tags=["issues"])
    def get(self, request):
        raw_project_id = request.query_params.get("project")
        if not raw_project_id:
            raise ValidationError({"project": "This query parameter is required."})

        project_id = UUID(raw_project_id)
        _require_project(project_id)
        _require_issue_view(request.user.id, project_id)

        sprint_param = request.query_params.get("sprint")
        sprint_is_null = sprint_param is not None and sprint_param.lower() == "null"
        sprint_id = None if sprint_is_null else _parse_uuid(sprint_param)

        assignee_param = request.query_params.get("assignee")
        assignee_is_null = assignee_param is not None and assignee_param.lower() == "unassigned"
        assignee_id = None if assignee_is_null else _parse_uuid(assignee_param)

        label_params = [value.strip() for value in request.query_params.getlist("label") if value.strip()]
        labels_csv = request.query_params.get("labels")
        if labels_csv:
            label_params.extend(
                value.strip() for value in labels_csv.split(",") if value.strip()
            )
        labels = label_params or None

        issues = get_project_issues(
            project_id,
            sprint_id=sprint_id,
            sprint_is_null=sprint_is_null,
            assignee_id=assignee_id,
            assignee_is_null=assignee_is_null,
            status_id=_parse_uuid(request.query_params.get("status")),
            priority=request.query_params.get("priority") or None,
            labels=labels,
            search=request.query_params.get("search") or None,
            sort=request.query_params.get("sort") or None,
        )

        if (
            request.query_params.get("page") is not None
            or request.query_params.get("page_size") is not None
        ):
            paginator = IssueListPagination()
            page = paginator.paginate_queryset(issues, request)
            serialized = IssueSerializer(page, many=True).data
            return paginator.get_paginated_response(serialized)

        return success_response(
            data={"issues": IssueSerializer(issues, many=True).data},
        )

    @extend_schema(request=IssueCreateSerializer, responses=IssueSerializer, tags=["issues"])
    def post(self, request):
        raw_project_id = request.query_params.get("project")
        if not raw_project_id:
            raise ValidationError({"project": "This query parameter is required."})

        project_id = UUID(raw_project_id)
        _require_project(project_id)

        serializer = IssueCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = issue_service.create_issue(
            user=request.user,
            project_id=project_id,
            **_create_kwargs(serializer.validated_data),
        )
        return success_response(
            data={"issue": IssueSerializer(issue).data},
            status=201,
        )


class ProjectKanbanView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id: UUID):
        _require_project(project_id)
        _require_issue_view(request.user.id, project_id)

        filters = _parse_board_filter_params(request, request.user.id)
        board = get_project_board_metadata(project_id, filters=filters)
        return success_response(data={"board": _kanban_board_data(project_id, board)})


class ProjectBoardColumnView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id: UUID, column_id: str):
        _require_project(project_id)
        _require_issue_view(request.user.id, project_id)

        filters = _parse_board_filter_params(request, request.user.id)
        page, page_size = _parse_board_pagination(request)
        column_page = get_board_column_issues(
            project_id,
            column_id,
            filters=filters,
            page=page,
            page_size=page_size,
        )
        if column_page is None:
            raise ValidationError({"column_id": f"Column '{column_id}' not found."})

        return success_response(data=_kanban_column_issues_data(column_page))


class ProjectKanbanFiltersView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id: UUID):
        _require_project(project_id)
        _require_issue_view(request.user.id, project_id)

        return success_response(
            data={"filters": get_kanban_board_filters(project_id)},
        )


class SprintKanbanView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def get(self, request, sprint_id: UUID):
        filters = _parse_board_filter_params(request, request.user.id)
        board = get_sprint_board_metadata(sprint_id, filters=filters)
        if board is None:
            raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")

        project_id = board["sprint"].project_id
        _require_issue_view(request.user.id, project_id)
        return success_response(data={"board": _kanban_board_data(project_id, board)})


class ProjectSprintKanbanView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id: UUID, sprint_id: UUID):
        _require_project(project_id)
        if get_project_sprint_by_id(project_id, sprint_id) is None:
            raise SprintNotFoundError(
                f"Sprint '{sprint_id}' not found in project '{project_id}'."
            )

        filters = _parse_board_filter_params(request, request.user.id)
        board = get_sprint_board_metadata(sprint_id, filters=filters)
        if board is None:
            raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")

        _require_issue_view(request.user.id, project_id)
        return success_response(data={"board": _kanban_board_data(project_id, board)})


class ProjectSprintBoardColumnView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def get(self, request, project_id: UUID, sprint_id: UUID, column_id: str):
        _require_project(project_id)
        if get_project_sprint_by_id(project_id, sprint_id) is None:
            raise SprintNotFoundError(
                f"Sprint '{sprint_id}' not found in project '{project_id}'."
            )

        _require_issue_view(request.user.id, project_id)

        filters = _parse_board_filter_params(request, request.user.id)
        page, page_size = _parse_board_pagination(request)
        column_page = get_board_column_issues(
            project_id,
            column_id,
            sprint_id=sprint_id,
            filters=filters,
            page=page,
            page_size=page_size,
        )
        if column_page is None:
            raise ValidationError({"column_id": f"Column '{column_id}' not found."})

        return success_response(data=_kanban_column_issues_data(column_page))


class IssueDetailView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=IssueSerializer, tags=["issues"])
    def get(self, request, issue_id: UUID):
        issue = _require_issue(issue_id)
        _require_issue_view(request.user.id, issue.project_id)
        return success_response(data={"issue": IssueSerializer(issue).data})

    @extend_schema(request=IssueUpdateSerializer, responses=IssueSerializer, tags=["issues"])
    def patch(self, request, issue_id: UUID):
        serializer = IssueUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        issue = issue_service.update_issue(
            user=request.user,
            issue_id=issue_id,
            **serializer.validated_data,
        )
        return success_response(data={"issue": IssueSerializer(issue).data})

    @extend_schema(tags=["issues"])
    def delete(self, request, issue_id: UUID):
        issue_service.delete_issue(user=request.user, issue_id=issue_id)
        return success_response(status=204)


class IssueAssignSprintView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(request=IssueMoveSprintSerializer, responses=IssueSerializer, tags=["issues"])
    def post(self, request, issue_id: UUID):
        serializer = IssueMoveSprintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = issue_service.assign_sprint(
            user=request.user,
            issue_id=issue_id,
            sprint_id=serializer.validated_data.get("sprint_id"),
        )
        return success_response(data={"issue": IssueSerializer(issue).data})


class IssueTransitionView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(request=IssueTransitionSerializer, responses=IssueSerializer, tags=["issues"])
    def post(self, request, issue_id: UUID):
        serializer = IssueTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        issue = transition_service.transition_issue(
            request.user,
            issue_id,
            serializer.validated_data["to_status_id"],
        )
        return success_response(data={"issue": IssueSerializer(issue).data})


class IssueBulkAssignSprintView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(request=IssueBulkAssignSprintSerializer, tags=["issues"])
    def post(self, request):
        serializer = IssueBulkAssignSprintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = issue_service.bulk_assign_sprint(
            user=request.user,
            issue_ids=serializer.validated_data["issue_ids"],
            sprint_id=serializer.validated_data.get("sprint_id"),
        )
        return success_response(data={"updated": updated})


class IssueCommentListCreateView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=CommentSerializer(many=True), tags=["issues"])
    def get(self, request, issue_id: UUID):
        issue = _require_issue(issue_id)
        _require_issue_view(request.user.id, issue.project_id)
        comments = get_issue_comments(issue_id)
        return success_response(data={"comments": CommentSerializer(comments, many=True).data})

    @extend_schema(request=CommentCreateSerializer, responses=CommentSerializer, tags=["issues"])
    def post(self, request, issue_id: UUID):
        serializer = CommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = comment_service.create_comment(
            user=request.user,
            issue_id=issue_id,
            body=serializer.validated_data["body"],
        )
        return success_response(data={"comment": CommentSerializer(comment).data}, status=201)


class IssueAttachmentListCreateView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=AttachmentSerializer(many=True), tags=["issues"])
    def get(self, request, issue_id: UUID):
        issue = _require_issue(issue_id)
        _require_issue_view(request.user.id, issue.project_id)
        attachments = get_issue_attachments(issue_id)
        return success_response(
            data={"attachments": AttachmentSerializer(attachments, many=True).data}
        )

    @extend_schema(request=AttachmentSerializer, responses=AttachmentSerializer, tags=["issues"])
    def post(self, request, issue_id: UUID):
        issue = _require_issue(issue_id)
        _require_issue_view(request.user.id, issue.project_id)

        serializer = AttachmentSerializer(
            data={
                "issue": str(issue.id),
                "file": request.data.get("file"),
            }
        )
        serializer.is_valid(raise_exception=True)

        attachment = attachment_service.upload_attachment(
            user=request.user,
            issue_id=issue_id,
            file=serializer.validated_data["file"],
        )
        return success_response(
            data={"attachment": AttachmentSerializer(attachment).data},
            status=201,
        )


class IssueActivityListView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=IssueActivitySerializer(many=True), tags=["issues"])
    def get(self, request, issue_id: UUID):
        issue = _require_issue(issue_id)
        _require_issue_view(request.user.id, issue.project_id)
        activity = get_issue_activity(issue_id)
        return success_response(
            data={"activity": IssueActivitySerializer(activity, many=True).data}
        )


class IssueSubtaskListCreateView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=SubtaskSerializer(many=True), tags=["issues"])
    def get(self, request, issue_id: UUID):
        issue = _require_issue(issue_id)
        _require_issue_view(request.user.id, issue.project_id)
        subtasks = get_issue_subtasks(issue_id)
        return success_response(
            data={"subtasks": SubtaskSerializer(subtasks, many=True).data}
        )

    @extend_schema(request=SubtaskCreateSerializer, responses=SubtaskSerializer, tags=["issues"])
    def post(self, request, issue_id: UUID):
        _require_issue(issue_id)
        serializer = SubtaskCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subtask = issue_service.create_subtask(
            user=request.user,
            parent_issue_id=issue_id,
            title=serializer.validated_data["title"],
        )
        return success_response(
            data={"subtask": SubtaskSerializer(subtask).data},
            status=201,
        )


class SubtaskDetailView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(request=SubtaskUpdateSerializer, responses=SubtaskSerializer, tags=["issues"])
    def patch(self, request, subtask_id: UUID):
        subtask = _require_issue(subtask_id)
        _require_issue_view(request.user.id, subtask.project_id)
        serializer = SubtaskUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = issue_service.update_subtask(
            user=request.user,
            subtask_id=subtask_id,
            title=serializer.validated_data.get("title"),
            done=serializer.validated_data.get("done"),
        )
        return success_response(data={"subtask": SubtaskSerializer(updated).data})

    @extend_schema(tags=["issues"])
    def delete(self, request, subtask_id: UUID):
        issue_service.delete_issue(user=request.user, issue_id=subtask_id)
        return success_response(status=204)


class CommentDetailView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(request=CommentUpdateSerializer, responses=CommentSerializer, tags=["issues"])
    def patch(self, request, comment_id: UUID):
        serializer = CommentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = comment_service.update_comment(
            user=request.user,
            comment_id=comment_id,
            body=serializer.validated_data["body"],
        )
        return success_response(data={"comment": CommentSerializer(comment).data})

    @extend_schema(tags=["issues"])
    def delete(self, request, comment_id: UUID):
        comment_service.delete_comment(user=request.user, comment_id=comment_id)
        return success_response(status=204)


class AttachmentDetailView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["issues"])
    def delete(self, request, attachment_id: UUID):
        attachment_service.delete_attachment(user=request.user, attachment_id=attachment_id)
        return success_response(status=204)
