from uuid import UUID

from django.db import transaction
from django.utils import timezone

from apps.contracts.organization_contract import get_organization_by_id
from apps.contracts.project_contract import ProjectDTO
from apps.contracts.workflow_contract import seed_default_workflow
from apps.organizations.exceptions import OrganizationNotFoundError
from apps.projects.exceptions import (
    ProjectArchivedError,
    ProjectKeyConflictError,
    ProjectMembershipError,
    ProjectMethodologyError,
    ProjectNotFoundError,
    ProjectSlugConflictError,
)
from apps.projects.models import (
    BoardType,
    Project,
    ProjectMember,
    ProjectMethodology,
    ProjectRole,
    ProjectStatus,
    ProjectVisibility,
)
from apps.projects.selectors import select_project_by_id, select_project_member


def _normalize_key(key: str) -> str:
    return key.strip().upper()


def _normalize_slug(slug: str) -> str:
    return slug.strip().lower()


def _ensure_project_editable(project: Project) -> None:
    if project.status == ProjectStatus.ARCHIVED:
        raise ProjectArchivedError("Archived projects are read-only.")


def require_scrum_project(project_id: UUID) -> None:
    """Reject sprint-related operations on non-Scrum projects."""
    project = select_project_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
    if project.methodology != ProjectMethodology.SCRUM:
        raise ProjectMethodologyError(
            "Sprint operations are not supported for Kanban projects."
        )


def require_kanban_project(project_id: UUID) -> None:
    """Reject Kanban-only operations on non-Kanban projects."""
    project = select_project_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")
    if project.methodology != ProjectMethodology.KANBAN:
        raise ProjectMethodologyError(
            "Board configuration is only supported for Kanban projects."
        )


def _resolve_methodology_fields(
    *,
    methodology: str = ProjectMethodology.SCRUM,
    default_sprint_weeks: int | None = None,
) -> dict:
    if methodology == ProjectMethodology.KANBAN:
        return {
            "methodology": ProjectMethodology.KANBAN,
            "board_type": BoardType.KANBAN,
            "default_sprint_weeks": None,
        }

    return {
        "methodology": ProjectMethodology.SCRUM,
        "board_type": BoardType.SCRUM,
        "default_sprint_weeks": default_sprint_weeks if default_sprint_weeks is not None else 2,
    }


def create_project(
    *,
    organization: UUID,
    name: str,
    key: str,
    slug: str,
    creator,
    description: str = "",
    lead_user_id: UUID | None = None,
    visibility: str = ProjectVisibility.ORGANIZATION,
    methodology: str = ProjectMethodology.SCRUM,
    default_sprint_weeks: int | None = None,
) -> ProjectDTO:
    if get_organization_by_id(organization) is None:
        raise OrganizationNotFoundError(f"Organization '{organization}' does not exist.")

    normalized_key = _normalize_key(key)
    normalized_slug = _normalize_slug(slug)

    if Project.objects.filter(organization_id=organization, key=normalized_key).exists():
        raise ProjectKeyConflictError(
            f"Project key '{normalized_key}' is already in use in this organization."
        )

    if Project.objects.filter(organization_id=organization, slug=normalized_slug).exists():
        raise ProjectSlugConflictError(
            f"Project slug '{normalized_slug}' is already in use in this organization."
        )

    if lead_user_id is not None and lead_user_id != creator.pk:
        raise ProjectMembershipError("Lead user must be an existing project member.")

    methodology_fields = _resolve_methodology_fields(
        methodology=methodology,
        default_sprint_weeks=default_sprint_weeks,
    )

    with transaction.atomic():
        project = Project.objects.create(
            organization_id=organization,
            key=normalized_key,
            slug=normalized_slug,
            name=name.strip(),
            description=description,
            status=ProjectStatus.ACTIVE,
            visibility=visibility,
            lead_user_id=lead_user_id,
            created_by=creator,
            updated_by=creator,
            **methodology_fields,
        )
        ProjectMember.objects.create(
            project=project,
            user=creator,
            role=ProjectRole.PROJECT_ADMIN,
            created_by=creator,
            updated_by=creator,
        )
        seed_default_workflow(project.id)

    dto = select_project_by_id(project.id)
    assert dto is not None
    return dto


def update_project(
    *,
    project_id: UUID,
    actor,
    name: str | None = None,
    description: str | None = None,
    visibility: str | None = None,
    lead_user_id=...,
) -> ProjectDTO:
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist as exc:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.") from exc

    _ensure_project_editable(project)

    update_fields = ["updated_by", "updated_at"]

    if name is not None:
        project.name = name.strip()
        update_fields.append("name")
    if description is not None:
        project.description = description
        update_fields.append("description")
    if visibility is not None:
        project.visibility = visibility
        update_fields.append("visibility")
    if lead_user_id is not ...:
        if lead_user_id is not None and select_project_member(project_id, lead_user_id) is None:
            raise ProjectMembershipError("Lead user must be an existing project member.")
        project.lead_user_id = lead_user_id
        update_fields.append("lead_user")

    project.updated_by = actor
    project.save(update_fields=update_fields)

    dto = select_project_by_id(project.id)
    assert dto is not None
    return dto


def archive_project(*, project_id: UUID, actor) -> ProjectDTO:
    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist as exc:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.") from exc

    if project.status == ProjectStatus.ARCHIVED:
        dto = select_project_by_id(project.id)
        assert dto is not None
        return dto

    project.status = ProjectStatus.ARCHIVED
    project.archived_at = timezone.now()
    project.updated_by = actor
    project.save(update_fields=["status", "archived_at", "updated_by", "updated_at"])

    dto = select_project_by_id(project.id)
    assert dto is not None
    return dto

