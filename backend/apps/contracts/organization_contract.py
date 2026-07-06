"""
Organization module contract — DTOs and narrow read interfaces.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from uuid import UUID


@dataclass(frozen=True)
class OrganizationDTO:
    id: UUID
    name: str
    slug: str
    owner_id: UUID
    is_active: bool


@dataclass(frozen=True)
class OrganizationMemberDTO:
    organization_id: UUID
    user_id: UUID
    role: str
    is_active: bool
    joined_at: Optional[datetime] = None


@dataclass(frozen=True)
class OrganizationSummaryDTO:
    id: UUID
    name: str
    slug: str
    role: str
    is_active: bool
    project_count: int = 0
    member_count: int = 0


def get_organization_by_id(org_id: UUID) -> Optional[OrganizationDTO]:
    from apps.organizations.selectors import select_organization_by_id

    return select_organization_by_id(org_id)


def get_organization_by_slug(slug: str) -> Optional[OrganizationDTO]:
    from apps.organizations.selectors import select_organization_by_slug

    return select_organization_by_slug(slug)


def get_organizations_for_user(user_id: UUID) -> list[OrganizationSummaryDTO]:
    from apps.organizations.selectors import select_organizations_for_user

    return select_organizations_for_user(user_id)


def get_organization_member(user_id: UUID, org_id: UUID) -> Optional[OrganizationMemberDTO]:
    from apps.organizations.selectors import select_organization_member

    return select_organization_member(org_id, user_id)


def is_organization_member(user_id: UUID, org_id: UUID) -> bool:
    from apps.organizations.selectors import select_is_organization_member

    return select_is_organization_member(org_id, user_id)
