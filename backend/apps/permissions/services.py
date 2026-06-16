"""

Permission bridge — membership, role, and Phase 3 issue/sprint authorization.



All authorization flows through PermissionService; no inline role checks elsewhere.

"""

from uuid import UUID



from apps.contracts.membership_contract import get_project_role, user_has_project_access

from apps.contracts.organization_contract import get_organization_member, is_organization_member



_ORG_MANAGE_ROLES = frozenset({"owner", "admin"})

_PROJECT_EDIT_ROLES = frozenset({"project_admin", "project_manager"})

_PROJECT_MANAGE_MEMBER_ROLES = frozenset({"project_admin", "project_manager"})

_LABEL_MANAGE_ROLES = frozenset({"project_admin", "project_manager"})

_WORKFLOW_MANAGE_ROLES = frozenset({"project_admin", "project_manager"})

_ISSUE_WRITE_ROLES = frozenset({"project_admin", "project_manager", "developer", "qa"})

_ISSUE_ASSIGN_ROLES = frozenset({"project_admin", "project_manager", "developer"})

_SPRINT_MANAGE_ROLES = frozenset({"project_admin", "project_manager"})

_SPRINT_PLAN_ROLES = frozenset({"project_admin", "project_manager", "developer", "qa"})





def _role_in_project(user_id: UUID, project_id: UUID, allowed_roles: frozenset[str]) -> bool:

    if not user_has_project_access(user_id, project_id):

        return False

    role = get_project_role(user_id, project_id)

    return role in allowed_roles if role is not None else False





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



    def can_view_issue(self, user_id: UUID, project_id: UUID) -> bool:

        return user_has_project_access(user_id, project_id)



    def can_edit_project(self, user_id: UUID, project_id: UUID) -> bool:

        role = get_project_role(user_id, project_id)

        return role in _PROJECT_EDIT_ROLES if role is not None else False



    def can_manage_members(self, user_id: UUID, project_id: UUID) -> bool:

        role = get_project_role(user_id, project_id)

        return role in _PROJECT_MANAGE_MEMBER_ROLES if role is not None else False



    def can_manage_labels(self, user_id: UUID, project_id: UUID) -> bool:

        role = get_project_role(user_id, project_id)

        return role in _LABEL_MANAGE_ROLES if role is not None else False



    def can_manage_workflow(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _WORKFLOW_MANAGE_ROLES)



    def can_edit_issue(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _ISSUE_WRITE_ROLES)



    def can_assign_issue(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _ISSUE_ASSIGN_ROLES)



    def can_transition_issue(
        self,
        user_id: UUID,
        project_id: UUID,
    ) -> bool:
        return user_has_project_access(user_id, project_id)



    def can_manage_sprint(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _SPRINT_MANAGE_ROLES)



    def can_plan_sprint(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _SPRINT_PLAN_ROLES)



    def can_view_sprint(self, user_id: UUID, project_id: UUID) -> bool:

        return user_has_project_access(user_id, project_id)



    def can_start_sprint(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _SPRINT_MANAGE_ROLES)



    def can_complete_sprint(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _SPRINT_MANAGE_ROLES)



    def can_be_assigned(self, user_id: UUID, project_id: UUID) -> bool:

        return _role_in_project(user_id, project_id, _ISSUE_WRITE_ROLES)





permission_service = PermissionService()


