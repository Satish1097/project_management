from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.contracts.identity_contract import get_users_by_ids
from apps.contracts.membership_contract import list_project_members
from apps.contracts.organization_contract import get_organization_by_id
from apps.contracts.project_contract import (
    ProjectDTO,
    ProjectSummaryDTO,
    get_projects_for_organization,
)
from apps.foundation.responses import success_response
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
    ProjectMemberSerializer,
    ProjectMemberUpdateSerializer,
    ProjectUpdateSerializer,
)
from apps.projects.exceptions import ProjectAccessDeniedError, ProjectNotFoundError
from apps.projects.selectors import select_project_by_id
from apps.projects.services import (
    add_project_member,
    archive_project,
    create_project,
    remove_project_member,
    update_project,
    update_project_member,
)


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
