"""
Read-only project lookups and projections for apps.projects.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import Count, Q
from django.utils import timezone

from apps.contracts.project_contract import ProjectDTO, ProjectMemberDTO, ProjectSummaryDTO
from apps.issues.models import Issue, Priority
from apps.notifications.selectors import get_unread_notification_count
from apps.permissions.services import permission_service
from apps.projects.models import Project, ProjectMember, ProjectMethodology, ProjectStatus
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
        methodology=project.methodology,
        board_type=project.board_type,
        default_sprint_weeks=project.default_sprint_weeks,
        archived_at=project.archived_at,
    )


def _project_to_summary_dto(project: Project, *, is_member: bool = False) -> ProjectSummaryDTO:
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
        methodology=project.methodology,
        board_type=project.board_type,
        open_issue_count=open_issue_count,
        is_member=is_member,
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

    visible = [
        project
        for project in projects
        if permission_service.can_view_project(user_id, project.id)
    ]
    return [
        _project_to_summary_dto(
            project,
            is_member=project.id in member_project_ids,
        )
        for project in visible
    ]


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
    return ProjectMember.objects.filter(project_id=project_id, user_id=user_id).exists()


def _select_visible_dashboard_project_ids(user_id: UUID) -> list[UUID]:
    candidate_project_ids = ProjectMember.objects.filter(user_id=user_id).values_list(
        "project_id",
        flat=True,
    )
    visible_project_ids = Project.objects.filter(
        id__in=candidate_project_ids,
        status=ProjectStatus.ACTIVE,
        archived_at__isnull=True,
    ).values_list("id", flat=True)

    return [
        project_id
        for project_id in visible_project_ids
        if permission_service.can_view_project(user_id, project_id)
    ]


def select_dashboard_summary(user_id: UUID) -> dict[str, int]:
    project_ids = _select_visible_dashboard_project_ids(user_id)
    scrum_project_ids = Project.objects.filter(
        id__in=project_ids,
        methodology=ProjectMethodology.SCRUM,
    ).values_list("id", flat=True)
    today = timezone.localdate()

    open_issues = Issue.objects.filter(
        project_id__in=project_ids,
    ).exclude(status__category=WorkflowStatusCategory.DONE)

    return {
        "total_visible_projects": len(project_ids),
        "active_projects": len(project_ids),
        "active_sprints": Sprint.objects.filter(
            project_id__in=scrum_project_ids,
            status=SprintStatus.ACTIVE,
        ).count(),
        "open_issues": open_issues.count(),
        "assigned_to_me": open_issues.filter(assignees__id=user_id).distinct().count(),
        "overdue_issues": open_issues.filter(due_date__lt=today).count(),
        "unread_notification_count": get_unread_notification_count(user_id),
    }


def _active_sprints_report(project_id: UUID) -> list[dict]:
    """All active sprints for a project (Parallel Sprints)."""
    sprints = (
        Sprint.objects.filter(project_id=project_id, status=SprintStatus.ACTIVE)
        .only("id", "name", "status")
        .order_by("-created_at")
    )
    return [
        {
            "id": sprint.id,
            "name": sprint.name,
            "status": sprint.status,
        }
        for sprint in sprints
    ]


def _active_sprint_report(project_id: UUID) -> dict | None:
    """
    Single active sprint (most recent) for backward compatibility.

    Parallel Sprints: prefer ``_active_sprints_report`` when all active
    sprints matter.
    """
    active_sprints = _active_sprints_report(project_id)
    return active_sprints[0] if active_sprints else None


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
    if row["assignees__id"] is None:
        return None

    first_name = row["assignees__profile__first_name"] or ""
    last_name = row["assignees__profile__last_name"] or ""
    full_name = f"{first_name} {last_name}".strip()
    return full_name or row["assignees__email"]


def _select_issue_counts_by_assignee(project_id: UUID) -> list[dict]:
    assignees = (
        Issue.objects.filter(project_id=project_id, assignees__isnull=False)
        .values(
            "assignees__id",
            "assignees__email",
            "assignees__profile__first_name",
            "assignees__profile__last_name",
        )
        .annotate(count=Count("id", distinct=True))
        .order_by("assignees__email")
    )
    return [
        {
            "assignee_id": row["assignees__id"],
            "assignee_name": _assignee_name(row),
            "count": row["count"],
        }
        for row in assignees
    ]


def select_project_report_summary(user_id: UUID, project_id: UUID) -> dict | None:
    if not permission_service.can_view_project(user_id, project_id):
        return None

    project = select_project_by_id(project_id)
    if project is None:
        return None

    issues = Issue.objects.filter(project_id=project_id)
    done_issues = issues.filter(status__category=WorkflowStatusCategory.DONE)
    open_issues = issues.exclude(status__category=WorkflowStatusCategory.DONE)

    summary = {
        "total_issues": issues.count(),
        "open_issues": open_issues.count(),
        "done_issues": done_issues.count(),
        "issue_counts_by_status": _select_issue_counts_by_status(project_id),
        "issue_counts_by_priority": _select_issue_counts_by_priority(project_id),
        "issue_counts_by_assignee": _select_issue_counts_by_assignee(project_id),
    }

    if project.methodology == ProjectMethodology.KANBAN:
        summary["todo_issues"] = issues.filter(
            status__category=WorkflowStatusCategory.TODO,
        ).count()
        return summary

    summary["backlog_issues"] = issues.filter(
        Q(sprint__isnull=True) | ~Q(sprint__status=SprintStatus.ACTIVE)
    ).count()
    summary["active_sprint"] = _active_sprint_report(project_id)
    summary["active_sprints"] = _active_sprints_report(project_id)
    return summary
