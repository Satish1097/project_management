"""
Membership module contract — cross-cutting membership read interfaces.
"""
from typing import Optional
from uuid import UUID

from apps.contracts.organization_contract import OrganizationMemberDTO
from apps.contracts.project_contract import ProjectMemberDTO


def get_project_member(user_id: UUID, project_id: UUID) -> Optional[ProjectMemberDTO]:
    from apps.projects.selectors import select_project_member

    return select_project_member(project_id, user_id)


def get_project_role(user_id: UUID, project_id: UUID) -> Optional[str]:
    from apps.projects.selectors import select_project_role

    return select_project_role(project_id, user_id)


def list_project_members(project_id: UUID) -> list[ProjectMemberDTO]:
    from apps.projects.selectors import select_list_project_members

    return select_list_project_members(project_id)


def list_organization_members(org_id: UUID) -> list[OrganizationMemberDTO]:
    from apps.organizations.selectors import select_list_organization_members

    return select_list_organization_members(org_id)


def user_has_project_access(user_id: UUID, project_id: UUID) -> bool:
    from apps.projects.selectors import select_user_has_project_access

    return select_user_has_project_access(project_id, user_id)
