from uuid import UUID

from django.contrib.auth import get_user_model

from apps.contracts.organization_contract import OrganizationMemberDTO
from apps.organizations.exceptions import (
    OrganizationMembershipError,
    OrganizationNotFoundError,
)
from apps.organizations.models import Organization, OrganizationMember, OrganizationRole
from apps.organizations.selectors import select_organization_member

User = get_user_model()


def _count_active_owners(organization_id: UUID) -> int:
    return OrganizationMember.objects.filter(
        organization_id=organization_id,
        role=OrganizationRole.OWNER,
        is_active=True,
    ).count()


def add_organization_member(
    *,
    organization_id: UUID,
    user_id: UUID,
    added_by,
    role: str = OrganizationRole.MEMBER,
    can_create_projects: bool = False,
) -> OrganizationMemberDTO:
    try:
        Organization.objects.get(pk=organization_id)
    except Organization.DoesNotExist as exc:
        raise OrganizationNotFoundError(
            f"Organization '{organization_id}' does not exist."
        ) from exc

    if not User.objects.filter(pk=user_id).exists():
        raise OrganizationMembershipError(f"User '{user_id}' does not exist.")

    existing = select_organization_member(organization_id, user_id)
    if existing is not None:
        raise OrganizationMembershipError(
            f"User '{user_id}' is already a member of organization '{organization_id}'."
        )

    OrganizationMember.objects.create(
        organization_id=organization_id,
        user_id=user_id,
        role=role,
        can_create_projects=can_create_projects,
        added_by=added_by,
        created_by=added_by,
        updated_by=added_by,
    )

    dto = select_organization_member(organization_id, user_id)
    assert dto is not None
    return dto


def _member_role(member) -> str:
    return member.role


def update_organization_member(
    *,
    organization_id: UUID,
    user_id: UUID,
    role: str,
    can_create_projects: bool | None = None,
) -> OrganizationMemberDTO:
    try:
        organization = Organization.objects.get(pk=organization_id)
    except Organization.DoesNotExist as exc:
        raise OrganizationNotFoundError(
            f"Organization '{organization_id}' does not exist."
        ) from exc

    try:
        member = OrganizationMember.objects.get(
            organization_id=organization_id,
            user_id=user_id,
        )
    except OrganizationMember.DoesNotExist as exc:
        raise OrganizationMembershipError(
            f"User '{user_id}' is not a member of organization '{organization_id}'."
        ) from exc

    if not member.is_active:
        raise OrganizationMembershipError("Cannot update an inactive organization member.")

    if _member_role(member) == OrganizationRole.OWNER and role != OrganizationRole.OWNER:
        if _count_active_owners(organization_id) <= 1:
            raise OrganizationMembershipError(
                "Last organization owner cannot be demoted without ownership transfer."
            )

    member.role = role
    update_fields = ["role", "updated_at"]
    if can_create_projects is not None:
        member.can_create_projects = can_create_projects
        update_fields.append("can_create_projects")
    member.save(update_fields=update_fields)

    if role == OrganizationRole.OWNER:
        organization.owner_id = user_id
        organization.save(update_fields=["owner_id", "updated_at"])

    dto = select_organization_member(organization_id, user_id)
    assert dto is not None
    return dto


def remove_organization_member(
    *,
    organization_id: UUID,
    user_id: UUID,
) -> None:
    try:
        organization = Organization.objects.get(pk=organization_id)
    except Organization.DoesNotExist as exc:
        raise OrganizationNotFoundError(
            f"Organization '{organization_id}' does not exist."
        ) from exc

    if organization.owner_id == user_id:
        raise OrganizationMembershipError("Organization owner cannot be removed.")

    try:
        member = OrganizationMember.objects.get(
            organization_id=organization_id,
            user_id=user_id,
        )
    except OrganizationMember.DoesNotExist as exc:
        raise OrganizationMembershipError(
            f"User '{user_id}' is not a member of organization '{organization_id}'."
        ) from exc

    if not member.is_active:
        return None

    member.is_active = False
    member.save(update_fields=["is_active", "updated_at"])
    return None
