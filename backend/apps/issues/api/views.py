from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

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
)
from apps.issues.exceptions import IssueNotFoundError
from apps.issues.selectors import (
    get_issue_activity,
    get_issue_attachments,
    get_issue_by_id,
    get_issue_comments,
    get_project_issues,
    get_project_kanban,
)
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
    issues = [_kanban_issue_data(issue, status) for issue in column["issues"]]
    return {
        "status_id": str(status["id"]),
        "status_slug": status["slug"],
        "status_name": status["name"],
        "status": status,
        "issues": issues,
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
        "grouped_issues": {
            column["status_slug"]: column["issues"]
            for column in columns
        },
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

        issues = get_project_issues(
            project_id,
            sprint_id=sprint_id,
            sprint_is_null=sprint_is_null,
            assignee_id=_parse_uuid(request.query_params.get("assignee")),
            status_id=_parse_uuid(request.query_params.get("status")),
            priority=request.query_params.get("priority") or None,
            search=request.query_params.get("search") or None,
        )
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

        board = get_project_kanban(project_id)
        return success_response(data={"board": _kanban_board_data(project_id, board)})


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
