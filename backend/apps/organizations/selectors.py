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
        can_create_projects=member.can_create_projects,
        joined_at=member.created_at,
    )


def _membership_to_organization_summary(
    membership: OrganizationMember,
) -> OrganizationSummaryDTO:
    organization = membership.organization
    project_count = getattr(membership, "project_count_annotated", 0)
    member_count = getattr(membership, "member_count_annotated", 0)
    return OrganizationSummaryDTO(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        role=membership.role,
        is_active=organization.is_active,
        can_create_projects=membership.can_create_projects,
        project_count=project_count,
        member_count=member_count,
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
    from django.db.models import Count, OuterRef, Subquery, Value
    from django.db.models.functions import Coalesce
    from apps.projects.models import Project
    from apps.organizations.models import OrganizationMember as OrgMember

    projects_subquery = Project.objects.filter(
        organization_id=OuterRef("organization_id")
    ).values("organization_id").annotate(cnt=Count("id")).values("cnt")

    members_subquery = OrgMember.objects.filter(
        organization_id=OuterRef("organization_id")
    ).values("organization_id").annotate(cnt=Count("id")).values("cnt")

    memberships = (
        OrganizationMember.objects.filter(user_id=user_id, is_active=True)
        .select_related("organization")
        .annotate(
            project_count_annotated=Coalesce(Subquery(projects_subquery), Value(0)),
            member_count_annotated=Coalesce(Subquery(members_subquery), Value(0)),
        )
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
