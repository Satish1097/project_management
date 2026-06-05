"""
Phase 2 permission bridge — membership and role checks only.

Full RBAC / workflow matrix deferred to Phase 3.
"""
from uuid import UUID

from apps.contracts.membership_contract import get_project_role, user_has_project_access
from apps.contracts.organization_contract import get_organization_member, is_organization_member

_ORG_MANAGE_ROLES = frozenset({"owner", "admin"})
_PROJECT_EDIT_ROLES = frozenset({"project_admin", "project_manager"})
_PROJECT_MANAGE_MEMBER_ROLES = frozenset({"project_admin", "project_manager"})


class PermissionService:
    def can_view_organization(self, user_id: UUID, organization_id: UUID) -> bool:
        return is_organization_member(user_id, organization_id)

    def can_manage_organization(self, user_id: UUID, organization_id: UUID) -> bool:
        member = get_organization_member(user_id, organization_id)
        if member is None or not member.is_active:
            return False
        return member.role in _ORG_MANAGE_ROLES

    def can_create_project(self, user_id: UUID, organization_id: UUID) -> bool:
        return is_organization_member(user_id, organization_id)

    def can_view_project(self, user_id: UUID, project_id: UUID) -> bool:
        return user_has_project_access(user_id, project_id)

    def can_edit_project(self, user_id: UUID, project_id: UUID) -> bool:
        role = get_project_role(user_id, project_id)
        return role in _PROJECT_EDIT_ROLES if role is not None else False

    def can_manage_members(self, user_id: UUID, project_id: UUID) -> bool:
        role = get_project_role(user_id, project_id)
        return role in _PROJECT_MANAGE_MEMBER_ROLES if role is not None else False

    def can_manage_workflow(self, user_id: UUID, project_id: UUID) -> bool:
        return False


permission_service = PermissionService()
