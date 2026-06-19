"""
Read-only project lookups and projections for apps.projects.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import Count, Q
from django.utils import timezone

from apps.contracts.organization_contract import is_organization_member
from apps.contracts.project_contract import ProjectDTO, ProjectMemberDTO, ProjectSummaryDTO
from apps.issues.models import Issue, Priority
from apps.notifications.selectors import get_unread_notification_count
from apps.organizations.models import OrganizationMember
from apps.permissions.services import permission_service
from apps.projects.models import Project, ProjectMember, ProjectStatus, ProjectVisibility
from apps.sprints.models import Sprint, SprintStatus
from apps.workflow.models import WorkflowStatusCategory


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
    open_issue_count = (
        Issue.objects.filter(project_id=project.id)
        .exclude(status__category=WorkflowStatusCategory.DONE)
        .count()
    )
    return ProjectSummaryDTO(
        id=project.id,
        key=project.key,
        slug=project.slug,
        name=project.name,
        status=project.status,
        open_issue_count=open_issue_count,
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


def _select_visible_dashboard_project_ids(user_id: UUID) -> list[UUID]:
    member_project_ids = ProjectMember.objects.filter(user_id=user_id).values_list(
        "project_id",
        flat=True,
    )
    organization_ids = OrganizationMember.objects.filter(
        user_id=user_id,
        is_active=True,
    ).values_list("organization_id", flat=True)
    candidate_project_ids = Project.objects.filter(
        Q(id__in=member_project_ids)
        | Q(
            visibility=ProjectVisibility.ORGANIZATION,
            organization_id__in=organization_ids,
        ),
        status=ProjectStatus.ACTIVE,
        archived_at__isnull=True,
    ).values_list("id", flat=True)

    return [
        project_id
        for project_id in candidate_project_ids
        if permission_service.can_view_project(user_id, project_id)
    ]


def select_dashboard_summary(user_id: UUID) -> dict[str, int]:
    project_ids = _select_visible_dashboard_project_ids(user_id)
    today = timezone.localdate()

    open_issues = Issue.objects.filter(
        project_id__in=project_ids,
    ).exclude(status__category=WorkflowStatusCategory.DONE)

    return {
        "total_visible_projects": len(project_ids),
        "active_projects": len(project_ids),
        "active_sprints": Sprint.objects.filter(
            project_id__in=project_ids,
            status=SprintStatus.ACTIVE,
        ).count(),
        "open_issues": open_issues.count(),
        "assigned_to_me": open_issues.filter(assignee_id=user_id).count(),
        "overdue_issues": open_issues.filter(due_date__lt=today).count(),
        "unread_notification_count": get_unread_notification_count(user_id),
    }


def _active_sprint_report(project_id: UUID) -> dict | None:
    sprint = (
        Sprint.objects.filter(project_id=project_id, status=SprintStatus.ACTIVE)
        .only("id", "name", "status")
        .order_by("-created_at")
        .first()
    )
    if sprint is None:
        return None

    return {
        "id": sprint.id,
        "name": sprint.name,
        "status": sprint.status,
    }


def _select_issue_counts_by_status(project_id: UUID) -> list[dict]:
    statuses = (
        Project.objects.get(pk=project_id)
        .workflow_statuses.annotate(count=Count("issues"))
        .order_by("order")
    )
    return [
        {
            "status_id": status.id,
            "status_name": status.name,
            "count": status.count,
        }
        for status in statuses
    ]


def _select_issue_counts_by_priority(project_id: UUID) -> list[dict]:
    counts_by_priority = {
        row["priority"]: row["count"]
        for row in (
            Issue.objects.filter(project_id=project_id)
            .values("priority")
            .annotate(count=Count("id"))
            .order_by("priority")
        )
    }
    return [
        {
            "priority": priority,
            "count": counts_by_priority.get(priority, 0),
        }
        for priority in Priority.values
    ]


def _assignee_name(row: dict) -> str | None:
    if row["assignee_id"] is None:
        return None

    first_name = row["assignee__profile__first_name"] or ""
    last_name = row["assignee__profile__last_name"] or ""
    full_name = f"{first_name} {last_name}".strip()
    return full_name or row["assignee__email"]


def _select_issue_counts_by_assignee(project_id: UUID) -> list[dict]:
    assignees = (
        Issue.objects.filter(project_id=project_id)
        .values(
            "assignee_id",
            "assignee__email",
            "assignee__profile__first_name",
            "assignee__profile__last_name",
        )
        .annotate(count=Count("id"))
        .order_by("assignee__email")
    )
    return [
        {
            "assignee_id": row["assignee_id"],
            "assignee_name": _assignee_name(row),
            "count": row["count"],
        }
        for row in assignees
    ]


def select_project_report_summary(user_id: UUID, project_id: UUID) -> dict | None:
    if not permission_service.can_view_project(user_id, project_id):
        return None

    issues = Issue.objects.filter(project_id=project_id)
    done_issues = issues.filter(status__category=WorkflowStatusCategory.DONE)
    open_issues = issues.exclude(status__category=WorkflowStatusCategory.DONE)

    return {
        "total_issues": issues.count(),
        "open_issues": open_issues.count(),
        "done_issues": done_issues.count(),
        "backlog_issues": issues.filter(
            Q(sprint__isnull=True) | ~Q(sprint__status=SprintStatus.ACTIVE)
        ).count(),
        "active_sprint": _active_sprint_report(project_id),
        "issue_counts_by_status": _select_issue_counts_by_status(project_id),
        "issue_counts_by_priority": _select_issue_counts_by_priority(project_id),
        "issue_counts_by_assignee": _select_issue_counts_by_assignee(project_id),
    }
