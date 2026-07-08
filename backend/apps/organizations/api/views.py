from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.contracts.identity_contract import get_users_by_ids
from apps.contracts.membership_contract import list_organization_members
from apps.contracts.organization_contract import (
    OrganizationDTO,
    OrganizationSummaryDTO,
    get_organization_by_id,
)
from apps.foundation.responses import success_response
from apps.organizations.api.serializers import (
    OrganizationCreateSerializer,
    OrganizationMemberSerializer,
    OrganizationMemberUpdateSerializer,
    OrganizationUpdateSerializer,
)
from apps.organizations.exceptions import (
    OrganizationAccessDeniedError,
    OrganizationNotFoundError,
)
from apps.organizations.selectors import (
    select_organization_by_id,
    select_organizations_for_user,
)
from apps.organizations.services import (
    add_organization_member,
    create_organization,
    remove_organization_member,
    update_organization,
    update_organization_member,
)
from apps.permissions.drf_permissions import (
    Authenticated,
    CanManageOrganization,
    CanViewOrganization,
)
from apps.permissions.services import permission_service


def _organization_to_data(dto: OrganizationDTO) -> dict:
    return {
        "id": str(dto.id),
        "name": dto.name,
        "slug": dto.slug,
        "owner_id": str(dto.owner_id),
        "is_active": dto.is_active,
    }


def _organization_summary_to_data(dto: OrganizationSummaryDTO) -> dict:
    return {
        "id": str(dto.id),
        "name": dto.name,
        "slug": dto.slug,
        "role": dto.role,
        "is_active": dto.is_active,
        "can_create_projects": dto.can_create_projects,
        "project_count": dto.project_count,
        "member_count": dto.member_count,
    }


def _member_to_data(dto, users_by_id: dict | None = None) -> dict:
    data = {
        "user_id": str(dto.user_id),
        "organization_id": str(dto.organization_id),
        "role": dto.role,
        "is_active": dto.is_active,
        "can_create_projects": dto.can_create_projects,
    }
    if dto.joined_at is not None:
        data["joined_at"] = dto.joined_at.isoformat()
    user = (users_by_id or {}).get(dto.user_id)
    if user is not None:
        data["email"] = user.email
        data["display_name"] = user.display_name
    return data


def _require_org_view(user_id: UUID, organization_id: UUID) -> OrganizationDTO:
    organization = select_organization_by_id(organization_id)
    if organization is None:
        raise OrganizationNotFoundError(f"Organization '{organization_id}' does not exist.")
    if not permission_service.can_view_organization(user_id, organization_id):
        raise OrganizationAccessDeniedError("You do not have access to this organization.")
    return organization


class OrganizationListCreateView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["organizations"])
    def get(self, request):
        organizations = select_organizations_for_user(request.user.id)
        return success_response(
            data={"organizations": [_organization_summary_to_data(o) for o in organizations]},
        )

    @extend_schema(request=OrganizationCreateSerializer, tags=["organizations"])
    def post(self, request):
        serializer = OrganizationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        create_data = {
            **serializer.validated_data,
            "owner_user_id": request.user.id,
        }
        organization = create_organization(creator=request.user, **create_data)
        return success_response(
            data={"organization": _organization_to_data(organization)},
            status=201,
        )


class OrganizationDetailView(APIView):
    permission_classes = [Authenticated, CanViewOrganization]

    @extend_schema(tags=["organizations"])
    def get(self, request, org_id):
        organization = _require_org_view(request.user.id, org_id)
        return success_response(data={"organization": _organization_to_data(organization)})

    @extend_schema(request=OrganizationUpdateSerializer, tags=["organizations"])
    def patch(self, request, org_id):
        if not permission_service.can_manage_organization(request.user.id, org_id):
            raise OrganizationAccessDeniedError("You cannot manage this organization.")
        serializer = OrganizationUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        organization = update_organization(
            organization_id=org_id,
            actor=request.user,
            **serializer.validated_data,
        )
        return success_response(data={"organization": _organization_to_data(organization)})


class OrganizationMemberListCreateView(APIView):
    permission_classes = [Authenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [Authenticated(), CanManageOrganization()]
        return [Authenticated(), CanViewOrganization()]

    @extend_schema(tags=["organizations"])
    def get(self, request, org_id):
        _require_org_view(request.user.id, org_id)
        members = list_organization_members(org_id)
        users = get_users_by_ids([member.user_id for member in members])
        users_by_id = {user.id: user for user in users}
        return success_response(
            data={"members": [_member_to_data(m, users_by_id) for m in members]},
        )

    @extend_schema(request=OrganizationMemberSerializer, tags=["organizations"])
    def post(self, request, org_id):
        if get_organization_by_id(org_id) is None:
            raise OrganizationNotFoundError(f"Organization '{org_id}' does not exist.")
        serializer = OrganizationMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = add_organization_member(
            organization_id=org_id,
            added_by=request.user,
            **serializer.validated_data,
        )
        return success_response(data={"member": _member_to_data(member)}, status=201)


class OrganizationMemberDetailView(APIView):
    permission_classes = [Authenticated, CanManageOrganization]

    @extend_schema(request=OrganizationMemberUpdateSerializer, tags=["organizations"])
    def patch(self, request, org_id, user_id):
        if get_organization_by_id(org_id) is None:
            raise OrganizationNotFoundError(f"Organization '{org_id}' does not exist.")
        serializer = OrganizationMemberUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = update_organization_member(
            organization_id=org_id,
            user_id=user_id,
            **serializer.validated_data,
        )
        return success_response(data={"member": _member_to_data(member)})

    @extend_schema(tags=["organizations"])
    def delete(self, request, org_id, user_id):
        if get_organization_by_id(org_id) is None:
            raise OrganizationNotFoundError(f"Organization '{org_id}' does not exist.")
        remove_organization_member(organization_id=org_id, user_id=user_id)
        return success_response(message="Member removed successfully.")
