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


Authenticated = IsAuthenticated
