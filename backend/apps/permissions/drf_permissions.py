"""Thin DRF permission wrappers around PermissionService."""
from uuid import UUID

from rest_framework.permissions import BasePermission, IsAuthenticated

from apps.permissions.services import permission_service


def _as_uuid(value) -> UUID:
    return value if isinstance(value, UUID) else UUID(value)


class IsSuperuser(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class CanViewOrganization(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if org_id is None:
            return True
        return permission_service.can_view_organization(request.user.id, _as_uuid(org_id))


class CanManageOrganization(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if org_id is None:
            return False
        return permission_service.can_manage_organization(request.user.id, _as_uuid(org_id))


class CanCreateProject(BasePermission):
    def has_permission(self, request, view):
        org_id = view.kwargs.get("org_id")
        if org_id is None:
            return False
        return permission_service.can_create_project(request.user.id, _as_uuid(org_id))


class CanViewProject(BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if project_id is None:
            return False
        return permission_service.can_view_project(request.user.id, _as_uuid(project_id))


class CanEditProject(BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if project_id is None:
            return False
        return permission_service.can_edit_project(request.user.id, _as_uuid(project_id))


class CanManageProjectMembers(BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if project_id is None:
            return False
        return permission_service.can_manage_members(request.user.id, _as_uuid(project_id))


def _issue_project_id(issue_id) -> UUID | None:
    from apps.contracts.issue_contract import get_issue_by_id

    issue = get_issue_by_id(_as_uuid(issue_id))
    return issue.project_id if issue is not None else None


def _sprint_project_id(sprint_id) -> UUID | None:
    from apps.contracts.sprint_contract import get_sprint_by_id

    sprint = get_sprint_by_id(_as_uuid(sprint_id))
    return sprint.project_id if sprint is not None else None


class CanCreateIssue(BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if project_id is None:
            return False
        return permission_service.can_create_issue(request.user.id, _as_uuid(project_id))


class CanEditIssue(BasePermission):
    def has_permission(self, request, view):
        issue_id = view.kwargs.get("issue_id")
        project_id = _issue_project_id(issue_id)
        if project_id is None:
            return False
        return permission_service.can_edit_issue(request.user.id, project_id)


class CanAssignIssue(BasePermission):
    def has_permission(self, request, view):
        issue_id = view.kwargs.get("issue_id")
        project_id = _issue_project_id(issue_id)
        if project_id is None:
            return False
        return permission_service.can_assign_issue(request.user.id, project_id)


class CanTransitionIssue(BasePermission):
    def has_permission(self, request, view):
        from apps.contracts.issue_contract import get_issue_by_id
        from apps.contracts.workflow_contract import get_workflow_config

        issue_id = view.kwargs.get("issue_id")
        if issue_id is None:
            return False
        issue = get_issue_by_id(_as_uuid(issue_id))
        if issue is None:
            return False
        target_status_id = request.data.get("target_status_id")
        if not target_status_id:
            return False
        config = get_workflow_config(issue.project_id)
        target_slug = None
        for status in config.statuses:
            if str(status.id) == str(target_status_id):
                target_slug = status.slug
                break
        if target_slug is None:
            return False
        return permission_service.can_transition_issue(
            request.user.id,
            issue.project_id,
            issue.status_slug,
            target_slug,
        )


class CanViewIssueProject(BasePermission):
    def has_permission(self, request, view):
        issue_id = view.kwargs.get("issue_id")
        project_id = _issue_project_id(issue_id)
        if project_id is None:
            return False
        return permission_service.can_view_project(request.user.id, project_id)


class CanViewSprintProject(BasePermission):
    def has_permission(self, request, view):
        sprint_id = view.kwargs.get("sprint_id")
        project_id = _sprint_project_id(sprint_id)
        if project_id is None:
            return False
        return permission_service.can_view_project(request.user.id, project_id)


class CanPlanSprint(BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if project_id is None:
            sprint_id = view.kwargs.get("sprint_id")
            project_id = _sprint_project_id(sprint_id)
        if project_id is None:
            issue_id = view.kwargs.get("issue_id")
            project_id = _issue_project_id(issue_id)
        if project_id is None:
            return False
        return permission_service.can_plan_sprint(request.user.id, _as_uuid(project_id))


class CanManageSprint(BasePermission):
    def has_permission(self, request, view):
        project_id = view.kwargs.get("project_id")
        if project_id is None:
            sprint_id = view.kwargs.get("sprint_id")
            project_id = _sprint_project_id(sprint_id)
        if project_id is None:
            return False
        return permission_service.can_manage_sprint(request.user.id, _as_uuid(project_id))


CanViewSprintBoard = CanViewSprintProject


Authenticated = IsAuthenticated
