from uuid import UUID

from django.contrib.auth import get_user_model

from apps.contracts.project_contract import ProjectMemberDTO
from apps.projects.exceptions import ProjectMembershipError, ProjectNotFoundError
from apps.projects.models import Project, ProjectMember, ProjectRole
from apps.projects.selectors import select_project_member

User = get_user_model()


def _count_project_admins(project_id: UUID) -> int:
    return ProjectMember.objects.filter(
        project_id=project_id,
        role=ProjectRole.PROJECT_ADMIN,
    ).count()


def _ensure_not_last_project_admin(project_id: UUID, user_id: UUID) -> None:
    member = ProjectMember.objects.filter(project_id=project_id, user_id=user_id).first()
    if member is None or _member_role(member) != ProjectRole.PROJECT_ADMIN:
        return
    if _count_project_admins(project_id) <= 1:
        raise ProjectMembershipError(
            "Last project admin cannot be removed or demoted without a replacement."
        )


def add_project_member(
    *,
    project_id: UUID,
    user_id: UUID,
    added_by,
    role: str = ProjectRole.DEVELOPER,
) -> ProjectMemberDTO:
    try:
        Project.objects.get(pk=project_id)
    except Project.DoesNotExist as exc:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.") from exc

    if not User.objects.filter(pk=user_id).exists():
        raise ProjectMembershipError(f"User '{user_id}' does not exist.")

    existing = select_project_member(project_id, user_id)
    if existing is not None:
        raise ProjectMembershipError(
            f"User '{user_id}' is already a member of project '{project_id}'."
        )

    ProjectMember.objects.create(
        project_id=project_id,
        user_id=user_id,
        role=role,
        created_by=added_by,
        updated_by=added_by,
    )

    dto = select_project_member(project_id, user_id)
    assert dto is not None
    return dto


def _member_role(member) -> str:
    return member.role


def update_project_member(
    *,
    project_id: UUID,
    user_id: UUID,
    role: str,
) -> ProjectMemberDTO:
    try:
        Project.objects.get(pk=project_id)
    except Project.DoesNotExist as exc:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.") from exc

    try:
        member = ProjectMember.objects.get(project_id=project_id, user_id=user_id)
    except ProjectMember.DoesNotExist as exc:
        raise ProjectMembershipError(
            f"User '{user_id}' is not a member of project '{project_id}'."
        ) from exc

    if _member_role(member) == ProjectRole.PROJECT_ADMIN and role != ProjectRole.PROJECT_ADMIN:
        _ensure_not_last_project_admin(project_id, user_id)

    member.role = role
    member.save(update_fields=["role", "updated_at"])

    dto = select_project_member(project_id, user_id)
    assert dto is not None
    return dto


def remove_project_member(
    *,
    project_id: UUID,
    user_id: UUID,
) -> None:
    try:
        member = ProjectMember.objects.get(project_id=project_id, user_id=user_id)
    except ProjectMember.DoesNotExist as exc:
        raise ProjectMembershipError(
            f"User '{user_id}' is not a member of project '{project_id}'."
        ) from exc

    _ensure_not_last_project_admin(project_id, user_id)
    member.delete()
    return None
