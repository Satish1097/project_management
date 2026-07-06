from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.accounts.services.invitation_onboarding_service import invite_to_project
from apps.contracts.identity_contract import get_users_by_ids
from apps.contracts.membership_contract import list_project_members
from apps.contracts.organization_contract import get_organization_by_id
from apps.contracts.project_contract import (
    ProjectDTO,
    ProjectSummaryDTO,
    get_projects_for_organization,
)
from apps.foundation.responses import success_response
from apps.foundation.pagination import ActivityPagination
from apps.issues.selectors import (
    get_dashboard_activity_queryset,
    get_project_activity_queryset,
    select_dashboard_activity_feed,
    select_project_activity_feed,
    select_project_recent_activity,
    serialize_activity_feed_items,
)
from apps.organizations.exceptions import OrganizationAccessDeniedError, OrganizationNotFoundError
from apps.permissions.drf_permissions import (
    Authenticated,
    CanCreateProject,
    CanEditProject,
    CanManageProjectMembers,
    CanViewOrganization,
    CanViewProject,
)
from apps.permissions.services import permission_service
from apps.projects.api.serializers import (
    ProjectCreateSerializer,
    ProjectInviteSerializer,
    ProjectMemberSerializer,
    ProjectMemberUpdateSerializer,
    ProjectUpdateSerializer,
)
from apps.projects.exceptions import ProjectAccessDeniedError, ProjectNotFoundError
from apps.projects.selectors import (
    select_dashboard_summary,
    select_project_by_id,
    select_project_report_summary,
)
from apps.projects.services import (
    add_project_member,
    archive_project,
    create_project,
    remove_project_member,
    update_project,
    update_project_member,
)
from apps.sprints.selectors import select_project_sprint_health


def _project_to_data(dto: ProjectDTO) -> dict:
    data = {
        "id": str(dto.id),
        "organization_id": str(dto.organization_id),
        "key": dto.key,
        "slug": dto.slug,
        "name": dto.name,
        "description": dto.description,
        "status": dto.status,
        "visibility": dto.visibility,
        "lead_user_id": str(dto.lead_user_id) if dto.lead_user_id else None,
    }
    if dto.archived_at is not None:
        data["archived_at"] = dto.archived_at.isoformat()
    return data


def _project_summary_to_data(dto: ProjectSummaryDTO) -> dict:
    return {
        "id": str(dto.id),
        "key": dto.key,
        "slug": dto.slug,
        "name": dto.name,
        "status": dto.status,
        "open_issue_count": dto.open_issue_count,
        "active_sprint_id": str(dto.active_sprint_id) if dto.active_sprint_id else None,
        "recent_activity": select_project_recent_activity(dto.id),
    }


def _member_to_data(dto, users_by_id: dict | None = None) -> dict:
    data = {
        "user_id": str(dto.user_id),
        "project_id": str(dto.project_id),
        "role": dto.role,
    }
    if dto.joined_at is not None:
        data["joined_at"] = dto.joined_at.isoformat()
    user = (users_by_id or {}).get(dto.user_id)
    if user is not None:
        data["email"] = user.email
        data["display_name"] = user.display_name
    return data


def _require_project_view(user_id: UUID, project_id: UUID) -> ProjectDTO:
    project = select_project_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
    if not permission_service.can_view_project(user_id, project_id):
        raise ProjectAccessDeniedError("You do not have access to this project.")
    return project


class OrganizationProjectListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanCreateProject()]
        return [Authenticated(), CanViewOrganization()]

    @extend_schema(tags=["projects"])
    def get(self, request, org_id):
        if get_organization_by_id(org_id) is None:
            raise OrganizationNotFoundError(f"Organization '{org_id}' does not exist.")
        if not permission_service.can_view_organization(request.user.id, org_id):
            raise OrganizationAccessDeniedError("You do not have access to this organization.")
        projects = get_projects_for_organization(org_id, request.user.id)
        return success_response(
            data={"projects": [_project_summary_to_data(p) for p in projects]},
        )

    @extend_schema(request=ProjectCreateSerializer, tags=["projects"])
    def post(self, request, org_id):
        if get_organization_by_id(org_id) is None:
            raise OrganizationNotFoundError(f"Organization '{org_id}' does not exist.")
        serializer = ProjectCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data.pop("organization_id", None)
        project = create_project(
            organization=org_id,
            creator=request.user,
            **data,
        )
        return success_response(data={"project": _project_to_data(project)}, status=201)


class DashboardSummaryView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["dashboard"])
    def get(self, request):
        summary = select_dashboard_summary(request.user.id)
        return success_response(data={"summary": summary})


class DashboardActivityView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["dashboard"])
    def get(self, request):
        if (
            request.query_params.get("page") is not None
            or request.query_params.get("page_size") is not None
        ):
            event_filter = request.query_params.get("filter", "all")
            queryset = get_dashboard_activity_queryset(
                request.user.id,
                event_filter=event_filter,
            )
            paginator = ActivityPagination()
            page = paginator.paginate_queryset(queryset, request)
            items = serialize_activity_feed_items(page)
            return paginator.get_paginated_response(items)

        raw_limit = request.query_params.get("limit", "5")
        try:
            limit = max(1, min(int(raw_limit), 100))
        except (TypeError, ValueError):
            limit = 5
        activity = select_dashboard_activity_feed(request.user.id, limit=limit)
        return success_response(data={"activities": activity})


class ProjectActivityView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["projects"])
    def get(self, request, project_id):
        _require_project_view(request.user.id, project_id)

        if (
            request.query_params.get("page") is not None
            or request.query_params.get("page_size") is not None
        ):
            queryset = get_project_activity_queryset(request.user.id, project_id)
            paginator = ActivityPagination()
            page = paginator.paginate_queryset(queryset, request)
            items = serialize_activity_feed_items(page)
            return paginator.get_paginated_response(items)

        raw_limit = request.query_params.get("limit", "5")
        try:
            limit = max(1, min(int(raw_limit), 100))
        except (TypeError, ValueError):
            limit = 5
        activities = select_project_activity_feed(
            request.user.id,
            project_id=project_id,
            limit=limit,
        )
        return success_response(data={"activities": activities})


class ProjectDetailView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["projects"])
    def get(self, request, project_id):
        project = _require_project_view(request.user.id, project_id)
        return success_response(data={"project": _project_to_data(project)})

    @extend_schema(request=ProjectUpdateSerializer, tags=["projects"])
    def patch(self, request, project_id):
        if not permission_service.can_edit_project(request.user.id, project_id):
            raise ProjectAccessDeniedError("You cannot edit this project.")
        serializer = ProjectUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        project = update_project(
            project_id=project_id,
            actor=request.user,
            **serializer.validated_data,
        )
        return success_response(data={"project": _project_to_data(project)})


class ProjectReportSummaryView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["project-reports"])
    def get(self, request, project_id):
        report = select_project_report_summary(request.user.id, project_id)
        if report is None:
            raise ProjectAccessDeniedError("You do not have access to this project.")
        return success_response(data={"report": report})


class ProjectSprintHealthReportView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["project-reports"])
    def get(self, request, project_id):
        sprint_health = select_project_sprint_health(request.user.id, project_id)
        if sprint_health is None:
            raise ProjectAccessDeniedError("You do not have access to this project.")
        return success_response(data={"sprint_health": sprint_health})


class ProjectWorkloadReportView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    @extend_schema(tags=["project-reports"])
    def get(self, request, project_id):
        report = select_project_report_summary(request.user.id, project_id)
        if report is None:
            raise ProjectAccessDeniedError("You do not have access to this project.")
        return success_response(data={"workload": report["issue_counts_by_assignee"]})


class ProjectArchiveView(APIView):
    permission_classes = [Authenticated, CanEditProject]

    @extend_schema(tags=["projects"])
    def post(self, request, project_id):
        if select_project_by_id(project_id) is None:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
        project = archive_project(project_id=project_id, actor=request.user)
        return success_response(data={"project": _project_to_data(project)})


class ProjectMemberListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanManageProjectMembers()]
        return [Authenticated(), CanViewProject()]

    @extend_schema(tags=["projects"])
    def get(self, request, project_id):
        _require_project_view(request.user.id, project_id)
        members = list_project_members(project_id)
        users = get_users_by_ids([member.user_id for member in members])
        users_by_id = {user.id: user for user in users}
        return success_response(
            data={"members": [_member_to_data(m, users_by_id) for m in members]},
        )

    @extend_schema(request=ProjectMemberSerializer, tags=["projects"])
    def post(self, request, project_id):
        if select_project_by_id(project_id) is None:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
        serializer = ProjectMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = add_project_member(
            project_id=project_id,
            added_by=request.user,
            **serializer.validated_data,
        )
        return success_response(data={"member": _member_to_data(member)}, status=201)


class ProjectInviteView(APIView):
    permission_classes = [Authenticated, CanManageProjectMembers]

    @extend_schema(request=ProjectInviteSerializer, tags=["projects"])
    def post(self, request, project_id):
        serializer = ProjectInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        result = invite_to_project(
            actor=request.user,
            project_id=project_id,
            email=data["email"],
            project_role=data["role"],
        )
        status_code = 201 if result["status"] == "invite_sent" else 200
        return success_response(data=result, status=status_code)


class ProjectMemberDetailView(APIView):
    permission_classes = [Authenticated, CanManageProjectMembers]

    @extend_schema(request=ProjectMemberUpdateSerializer, tags=["projects"])
    def patch(self, request, project_id, user_id):
        if select_project_by_id(project_id) is None:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
        serializer = ProjectMemberUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = update_project_member(
            project_id=project_id,
            user_id=user_id,
            **serializer.validated_data,
        )
        return success_response(data={"member": _member_to_data(member)})

    @extend_schema(tags=["projects"])
    def delete(self, request, project_id, user_id):
        if select_project_by_id(project_id) is None:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
        remove_project_member(project_id=project_id, user_id=user_id)
        return success_response(message="Member removed successfully.")
