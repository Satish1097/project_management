"""
Read-only project lookups and projections for apps.projects.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from apps.contracts.organization_contract import is_organization_member
from apps.contracts.project_contract import ProjectDTO, ProjectMemberDTO, ProjectSummaryDTO
from apps.projects.models import Project, ProjectMember, ProjectStatus, ProjectVisibility


def _project_to_dto(project: Project) -> ProjectDTO:
    return ProjectDTO(
        id=project.id,
        organization_id=project.organization_id,
        key=project.key,
        slug=project.slug,
        name=project.name,
        description=project.description,
        status=project.status,
        visibility=project.visibility,
        lead_user_id=project.lead_user_id,
        archived_at=project.archived_at,
    )


def _project_to_summary_dto(project: Project) -> ProjectSummaryDTO:
    return ProjectSummaryDTO(
        id=project.id,
        key=project.key,
        slug=project.slug,
        name=project.name,
        status=project.status,
    )


def _project_member_to_dto(member: ProjectMember) -> ProjectMemberDTO:
    return ProjectMemberDTO(
        project_id=member.project_id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.created_at,
    )


def select_project_by_id(project_id: UUID) -> ProjectDTO | None:
    try:
        project = Project.objects.select_related("organization", "lead_user").get(
            pk=project_id
        )
    except Project.DoesNotExist:
        return None
    return _project_to_dto(project)


def select_project_summary(project_id: UUID) -> ProjectSummaryDTO | None:
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return None
    return _project_to_summary_dto(project)


def select_projects_for_organization(
    organization_id: UUID,
    user_id: UUID,
) -> list[ProjectSummaryDTO]:
    org_member = is_organization_member(user_id, organization_id)
    member_project_ids = set(
        ProjectMember.objects.filter(
            user_id=user_id,
            project__organization_id=organization_id,
        ).values_list("project_id", flat=True)
    )

    projects = Project.objects.filter(
        organization_id=organization_id,
        status=ProjectStatus.ACTIVE,
    ).order_by("name")

    visible = []
    for project in projects:
        if project.id in member_project_ids:
            visible.append(project)
        elif project.visibility == ProjectVisibility.ORGANIZATION and org_member:
            visible.append(project)
    return [_project_to_summary_dto(project) for project in visible]


def select_project_member(project_id: UUID, user_id: UUID) -> ProjectMemberDTO | None:
    try:
        member = ProjectMember.objects.get(project_id=project_id, user_id=user_id)
    except ProjectMember.DoesNotExist:
        return None
    return _project_member_to_dto(member)


def select_project_role(project_id: UUID, user_id: UUID) -> str | None:
    member = select_project_member(project_id, user_id)
    return member.role if member is not None else None


def select_list_project_members(project_id: UUID) -> list[ProjectMemberDTO]:
    members = (
        ProjectMember.objects.filter(project_id=project_id)
        .select_related("user")
        .order_by("role", "user__email")
    )
    return [_project_member_to_dto(member) for member in members]


def select_user_has_project_access(project_id: UUID, user_id: UUID) -> bool:
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return False

    if ProjectMember.objects.filter(project_id=project_id, user_id=user_id).exists():
        return True

    if (
        project.visibility == ProjectVisibility.ORGANIZATION
        and is_organization_member(user_id, project.organization_id)
    ):
        return True

    return False
