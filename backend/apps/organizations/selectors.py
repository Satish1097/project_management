"""
Read-only organization lookups and projections for apps.organizations.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from apps.contracts.organization_contract import (
    OrganizationDTO,
    OrganizationMemberDTO,
    OrganizationSummaryDTO,
)
from apps.organizations.models import Organization, OrganizationMember


def _organization_to_dto(organization: Organization) -> OrganizationDTO:
    return OrganizationDTO(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        owner_id=organization.owner_id,
        is_active=organization.is_active,
    )


def _organization_member_to_dto(member: OrganizationMember) -> OrganizationMemberDTO:
    return OrganizationMemberDTO(
        user_id=member.user_id,
        organization_id=member.organization_id,
        role=member.role,
        is_active=member.is_active,
        joined_at=member.created_at,
    )


def _membership_to_organization_summary(
    membership: OrganizationMember,
) -> OrganizationSummaryDTO:
    organization = membership.organization
    return OrganizationSummaryDTO(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        role=membership.role,
        is_active=organization.is_active,
    )


def select_organization_by_slug(slug: str) -> OrganizationDTO | None:
    try:
        organization = Organization.objects.select_related("owner").get(slug=slug.strip().lower())
    except Organization.DoesNotExist:
        return None
    return _organization_to_dto(organization)


def select_organization_by_id(organization_id: UUID) -> OrganizationDTO | None:
    try:
        organization = Organization.objects.select_related("owner").get(pk=organization_id)
    except Organization.DoesNotExist:
        return None
    return _organization_to_dto(organization)


def select_organizations_for_user(user_id: UUID) -> list[OrganizationSummaryDTO]:
    memberships = (
        OrganizationMember.objects.filter(user_id=user_id, is_active=True)
        .select_related("organization")
        .order_by("organization__name")
    )
    return [_membership_to_organization_summary(membership) for membership in memberships]


def select_organization_member(
    organization_id: UUID,
    user_id: UUID,
) -> OrganizationMemberDTO | None:
    try:
        member = OrganizationMember.objects.get(
            organization_id=organization_id,
            user_id=user_id,
        )
    except OrganizationMember.DoesNotExist:
        return None
    return _organization_member_to_dto(member)


def select_is_organization_member(organization_id: UUID, user_id: UUID) -> bool:
    return OrganizationMember.objects.filter(
        organization_id=organization_id,
        user_id=user_id,
        is_active=True,
    ).exists()


def select_list_organization_members(organization_id: UUID) -> list[OrganizationMemberDTO]:
    members = (
        OrganizationMember.objects.filter(organization_id=organization_id)
        .select_related("user")
        .order_by("role", "user__email")
    )
    return [_organization_member_to_dto(member) for member in members]
