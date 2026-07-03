"""
Read-only issue query helpers for apps.issues.

Selectors must not mutate data or contain business logic.
"""
from dataclasses import dataclass
from datetime import date, timedelta
from uuid import UUID

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Count, Q, QuerySet
from django.utils import timezone

from apps.contracts.identity_contract import get_users_by_ids
from apps.contracts.membership_contract import list_project_members
from apps.issues.models import Issue, IssueActivity, IssueAttachment, IssueComment, IssueType, Priority
from apps.label.selectors import get_active_labels
from apps.issues.models.activity import IssueActivityEventType
from apps.permissions.services import permission_service
from apps.issues.kanban_constants import DEFAULT_KANBAN_PAGE_SIZE, MAX_KANBAN_PAGE_SIZE
from apps.sprints.selectors import get_sprint_by_id
from apps.workflow.models import WorkflowStatusCategory
from apps.workflow.selectors import get_project_statuses
from apps.workflow.slug_utils import status_slug


def _optimized_issue_queryset() -> QuerySet[Issue]:
    return Issue.objects.select_related(
        "project",
        "sprint",
        "status",
        "assignee",
        "reporter",
    ).prefetch_related("labels")


def _optimized_comment_queryset() -> QuerySet[IssueComment]:
    return IssueComment.objects.select_related("author")


def _optimized_activity_queryset() -> QuerySet[IssueActivity]:
    return IssueActivity.objects.select_related("actor", "actor__profile")


def _optimized_attachment_queryset() -> QuerySet[IssueAttachment]:
    return IssueAttachment.objects.select_related("uploaded_by")


def get_issue_by_id(issue_id: UUID) -> Issue | None:
    return _optimized_issue_queryset().filter(pk=issue_id).first()


def get_comment_by_id(comment_id: UUID) -> IssueComment | None:
    return _optimized_comment_queryset().filter(pk=comment_id).first()


def get_activity_by_id(activity_id: UUID) -> IssueActivity | None:
    return _optimized_activity_queryset().filter(pk=activity_id).first()


def get_attachment_by_id(attachment_id: UUID) -> IssueAttachment | None:
    return _optimized_attachment_queryset().filter(pk=attachment_id).first()


def get_issue_subtasks(parent_issue_id: UUID) -> QuerySet[Issue]:
    return (
        _optimized_issue_queryset()
        .filter(parent_issue_id=parent_issue_id, type=IssueType.SUBTASK)
        .order_by("created_at")
    )


def get_issue_comments(issue_id: UUID) -> QuerySet[IssueComment]:
    return _optimized_comment_queryset().filter(issue_id=issue_id).order_by("created_at")


def get_issue_attachments(issue_id: UUID) -> QuerySet[IssueAttachment]:
    return _optimized_attachment_queryset().filter(issue_id=issue_id).order_by("created_at")


def get_issue_activity(issue_id: UUID) -> QuerySet[IssueActivity]:
    return _optimized_activity_queryset().filter(issue_id=issue_id).order_by("-created_at")


def _select_visible_activity_project_ids(user_id: UUID) -> list[UUID]:
    candidate_project_ids = (
        IssueActivity.objects.values_list("issue__project_id", flat=True).distinct()
    )
    return [
        project_id
        for project_id in candidate_project_ids
        if permission_service.can_view_project(user_id, project_id)
    ]


def _activity_actor_name(activity: IssueActivity) -> str | None:
    actor = activity.actor
    if actor is None:
        return None

    try:
        profile = actor.profile
    except ObjectDoesNotExist:
        profile = None

    if profile is not None:
        display_name = f"{profile.first_name} {profile.last_name}".strip()
        if display_name:
            return display_name

    return actor.email


def _activity_feed_item(activity: IssueActivity) -> dict:
    issue = activity.issue
    project = issue.project
    return {
        "id": str(activity.id),
        "actor": _activity_actor_name(activity),
        "event_type": activity.event_type,
        "issue": {
            "id": str(issue.id),
            "key": issue.key,
            "title": issue.title,
        },
        "project": {
            "id": str(project.id),
            "name": project.name,
        },
        "old_value": activity.old_value,
        "new_value": activity.new_value,
        "timestamp": activity.created_at.isoformat(),
    }


def serialize_activity_feed_items(activities) -> list[dict]:
    return [_activity_feed_item(activity) for activity in activities]


ACTIVITY_EVENT_FILTER_GROUPS: dict[str, list[str]] = {
    "comments": [
        IssueActivityEventType.COMMENT_ADDED,
        IssueActivityEventType.COMMENT_DELETED,
    ],
    "status_changes": [IssueActivityEventType.STATUS_CHANGED],
    "sprint_updates": [IssueActivityEventType.SPRINT_CHANGED],
    "member_actions": [IssueActivityEventType.ASSIGNEE_CHANGED],
}


def get_dashboard_activity_queryset(
    user_id: UUID,
    *,
    event_filter: str | None = None,
) -> QuerySet[IssueActivity]:
    project_ids = _select_visible_activity_project_ids(user_id)
    queryset = (
        _optimized_activity_queryset()
        .select_related("issue", "issue__project")
        .filter(issue__project_id__in=project_ids)
        .order_by("-created_at")
    )
    if event_filter and event_filter != "all":
        event_types = ACTIVITY_EVENT_FILTER_GROUPS.get(event_filter)
        if event_types:
            queryset = queryset.filter(event_type__in=event_types)
    return queryset


def select_dashboard_activity_feed(user_id: UUID, *, limit: int = 20) -> list[dict]:
    activities = get_dashboard_activity_queryset(user_id)[:limit]
    return [_activity_feed_item(activity) for activity in activities]


def select_sprint_activity_feed(
    user_id: UUID,
    *,
    project_id: UUID,
    sprint_id: UUID,
    limit: int = 20,
) -> list[dict]:
    if not permission_service.can_view_project(user_id, project_id):
        return []

    activities = (
        _optimized_activity_queryset()
        .select_related("issue", "issue__project")
        .filter(issue__project_id=project_id, issue__sprint_id=sprint_id)
        .order_by("-created_at")
    )
    return [_activity_feed_item(activity) for activity in activities[:limit]]


def get_project_activity_queryset(user_id: UUID, project_id: UUID) -> QuerySet[IssueActivity]:
    if not permission_service.can_view_project(user_id, project_id):
        return IssueActivity.objects.none()

    return (
        _optimized_activity_queryset()
        .select_related("issue", "issue__project")
        .filter(issue__project_id=project_id)
        .order_by("-created_at")
    )


def select_project_activity_feed(
    user_id: UUID,
    *,
    project_id: UUID,
    limit: int = 5,
) -> list[dict]:
    activities = get_project_activity_queryset(user_id, project_id)[:limit]
    return [_activity_feed_item(activity) for activity in activities]


def select_project_recent_activity(project_id: UUID) -> str | None:
    """Return a short human-friendly string describing the most recent activity for a project."""
    activity = (
        _optimized_activity_queryset()
        .select_related("actor", "issue")
        .filter(issue__project_id=project_id)
        .order_by("-created_at")
        .first()
    )
    if activity is None:
        return None

    actor = _activity_actor_name(activity) or "System"
    issue_key = activity.issue.key if activity.issue is not None else None
    et = activity.event_type

    if et == "status_changed":
        verb = "changed status on"
    elif et == "sprint_changed":
        verb = "moved"
    elif et == "comment_added":
        verb = "commented on"
    elif et == "assignee_changed":
        verb = "changed assignee for"
    else:
        verb = et.replace("_", " ")

    if issue_key:
        return f"{actor} {verb} {issue_key}"
    return f"{actor} {verb}"


def get_project_issue_by_id(project_id: UUID, issue_id: UUID) -> Issue | None:
    return (
        _optimized_issue_queryset()
        .filter(project_id=project_id, pk=issue_id)
        .first()
    )


ISSUE_LIST_SORT_FIELDS = frozenset(
    {
        "created_at",
        "-created_at",
        "title",
        "-title",
        "priority",
        "-priority",
        "key",
        "-key",
    }
)


def get_project_issues(
    project_id: UUID,
    *,
    sprint_id: UUID | None = None,
    sprint_is_null: bool = False,
    assignee_id: UUID | None = None,
    assignee_is_null: bool = False,
    status_id: UUID | None = None,
    priority: str | None = None,
    labels: list[str] | None = None,
    search: str | None = None,
    sort: str | None = None,
) -> QuerySet[Issue]:
    qs = _optimized_issue_queryset().filter(
        project_id=project_id,
        parent_issue__isnull=True,
    )

    if sprint_is_null:
        qs = qs.filter(sprint__isnull=True)
    elif sprint_id is not None:
        qs = qs.filter(sprint_id=sprint_id)
    if assignee_is_null:
        qs = qs.filter(assignee__isnull=True)
    elif assignee_id is not None:
        qs = qs.filter(assignee_id=assignee_id)
    if status_id is not None:
        qs = qs.filter(status_id=status_id)
    if priority is not None:
        qs = qs.filter(priority=priority)
    if labels:
        label_filter = Q()
        for label in labels:
            label_filter |= Q(labels__name__iexact=label)
        qs = qs.filter(label_filter).distinct()
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(key__icontains=search))

    order = sort if sort in ISSUE_LIST_SORT_FIELDS else "-created_at"
    return qs.order_by(order)


def get_sprint_issues(sprint_id: UUID) -> QuerySet[Issue]:
    return _optimized_issue_queryset().filter(sprint_id=sprint_id).order_by("-created_at")


def get_incomplete_sprint_issue_ids(sprint_id: UUID) -> list[UUID]:
    return list(
        _optimized_issue_queryset()
        .filter(sprint_id=sprint_id)
        .exclude(status__category=WorkflowStatusCategory.DONE)
        .values_list("id", flat=True)
    )


def get_backlog_issues(project_id: UUID) -> QuerySet[Issue]:
    return _optimized_issue_queryset().filter(
        project_id=project_id,
        sprint__isnull=True,
    )


def get_kanban_board_filters(project_id: UUID) -> dict:
    members = list_project_members(project_id)
    user_ids = [member.user_id for member in members]
    users_by_id = {user.id: user for user in get_users_by_ids(user_ids)}

    assignees = [
        {
            "id": "all",
            "display_name": "All",
            "avatar": None,
        },
        {
            "id": "unassigned",
            "display_name": "Unassigned",
            "avatar": None,
        },
    ]
    for member in members:
        user = users_by_id.get(member.user_id)
        assignees.append(
            {
                "id": str(member.user_id),
                "display_name": user.display_name if user is not None else "Unknown",
                "avatar": user.avatar if user is not None else None,
            }
        )

    statuses = []
    for status in get_project_statuses(project_id):
        statuses.append(
            {
                "id": str(status.id),
                "slug": status_slug(name=status.name, category=status.category),
                "name": status.name,
                "category": status.category,
                "color": status.color,
                "order": status.order,
                "is_default": status.is_default,
            }
        )

    labels = [
        {
            "id": str(label.id),
            "name": label.name,
            "color": label.color,
        }
        for label in get_active_labels(project_id)
    ]

    priorities = [
        {
            "id": "all",
            "label": "All",
        },
        *[
            {
                "id": value,
                "label": label,
            }
            for value, label in Priority.choices
        ],
    ]

    return {
        "assignees": assignees,
        "statuses": [
            {
                "id": "all",
                "slug": "all",
                "name": "All",
                "category": None,
                "color": None,
                "order": -1,
                "is_default": False,
            },
            *statuses,
        ],
        "labels": labels,
        "priorities": priorities,
    }


@dataclass(frozen=True)
class BoardFilterParams:
    assignee_id: UUID | None = None
    assignee_is_null: bool = False
    status_id: UUID | None = None
    priority: str | None = None
    labels: list[str] | None = None
    search: str | None = None
    due_date: str | None = None


def _apply_due_date_filter(qs: QuerySet[Issue], due_date: str) -> QuerySet[Issue]:
    today = timezone.localdate()
    value = due_date.lower()
    if value in ("none", "empty"):
        return qs.filter(due_date__isnull=True)
    if value == "overdue":
        return qs.filter(due_date__lt=today)
    if value == "today":
        return qs.filter(due_date=today)
    if value in ("week", "this_week"):
        return qs.filter(due_date__gte=today, due_date__lte=today + timedelta(days=7))
    try:
        parsed = date.fromisoformat(due_date)
    except ValueError:
        return qs
    return qs.filter(due_date=parsed)


def _apply_board_filters(qs: QuerySet[Issue], filters: BoardFilterParams) -> QuerySet[Issue]:
    if filters.assignee_is_null:
        qs = qs.filter(assignee__isnull=True)
    elif filters.assignee_id is not None:
        qs = qs.filter(assignee_id=filters.assignee_id)
    if filters.status_id is not None:
        qs = qs.filter(status_id=filters.status_id)
    if filters.priority is not None:
        qs = qs.filter(priority=filters.priority)
    if filters.labels:
        label_filter = Q()
        for label in filters.labels:
            label_filter |= Q(labels__name__iexact=label)
        qs = qs.filter(label_filter).distinct()
    if filters.search:
        qs = qs.filter(Q(title__icontains=filters.search) | Q(key__icontains=filters.search))
    if filters.due_date:
        qs = _apply_due_date_filter(qs, filters.due_date)
    return qs


def _board_base_queryset(project_id: UUID, sprint_id: UUID | None) -> QuerySet[Issue]:
    if sprint_id is not None:
        return get_sprint_issues(sprint_id)
    return get_project_issues(project_id)


def _resolve_board_status(project_id: UUID, column_id: str):
    statuses = list(get_project_statuses(project_id))
    try:
        status_uuid = UUID(column_id)
        for status in statuses:
            if status.id == status_uuid:
                return status
    except ValueError:
        pass

    column_lower = column_id.lower()
    for status in statuses:
        slug = status_slug(name=status.name, category=status.category)
        if slug == column_lower:
            return status
    return None


def get_board_metadata(
    project_id: UUID,
    *,
    sprint_id: UUID | None = None,
    sprint=None,
    filters: BoardFilterParams | None = None,
) -> dict:
    statuses = list(get_project_statuses(project_id))
    qs = _board_base_queryset(project_id, sprint_id)
    if filters:
        qs = _apply_board_filters(qs, filters)

    count_by_status = {
        row["status_id"]: row["count"]
        for row in qs.values("status_id").annotate(count=Count("id"))
    }

    return {
        "sprint": sprint,
        "columns": [
            {
                "status": status,
                "count": count_by_status.get(status.id, 0),
            }
            for status in statuses
        ],
    }


def get_project_board_metadata(
    project_id: UUID,
    *,
    filters: BoardFilterParams | None = None,
) -> dict:
    return get_board_metadata(project_id, sprint_id=None, sprint=None, filters=filters)


def get_sprint_board_metadata(
    sprint_id: UUID,
    *,
    filters: BoardFilterParams | None = None,
) -> dict | None:
    sprint = get_sprint_by_id(sprint_id)
    if sprint is None:
        return None
    return get_board_metadata(
        sprint.project_id,
        sprint_id=sprint_id,
        sprint=sprint,
        filters=filters,
    )


def get_board_column_issues(
    project_id: UUID,
    column_id: str,
    *,
    sprint_id: UUID | None = None,
    filters: BoardFilterParams | None = None,
    page: int = 1,
    page_size: int = DEFAULT_KANBAN_PAGE_SIZE,
) -> dict | None:
    status = _resolve_board_status(project_id, column_id)
    if status is None:
        return None

    if filters and filters.status_id is not None and filters.status_id != status.id:
        return {
            "status": status,
            "page": page,
            "page_size": page_size,
            "total": 0,
            "has_next": False,
            "issues": [],
        }

    qs = _board_base_queryset(project_id, sprint_id).filter(status_id=status.id)

    if filters:
        column_filters = BoardFilterParams(
            assignee_id=filters.assignee_id,
            assignee_is_null=filters.assignee_is_null,
            status_id=None,
            priority=filters.priority,
            labels=filters.labels,
            search=filters.search,
            due_date=filters.due_date,
        )
        qs = _apply_board_filters(qs, column_filters)

    total = qs.count()
    page = max(1, page)
    page_size = min(max(1, page_size), MAX_KANBAN_PAGE_SIZE)
    offset = (page - 1) * page_size
    issues = list(qs[offset : offset + page_size])
    has_next = offset + len(issues) < total

    return {
        "status": status,
        "page": page,
        "page_size": page_size,
        "total": total,
        "has_next": has_next,
        "issues": issues,
    }


def _build_kanban_board(project_id: UUID, issues: QuerySet[Issue], *, sprint=None) -> dict:
    statuses = list(get_project_statuses(project_id))
    issues_by_status_id = {status.id: [] for status in statuses}

    for issue in issues:
        if issue.status_id in issues_by_status_id:
            issues_by_status_id[issue.status_id].append(issue)

    return {
        "sprint": sprint,
        "columns": [
            {
                "status": status,
                "issues": issues_by_status_id[status.id],
            }
            for status in statuses
        ],
    }


def get_project_kanban(project_id: UUID) -> dict:
    issues = get_project_issues(project_id)
    return _build_kanban_board(project_id, issues, sprint=None)


def get_sprint_kanban(sprint_id: UUID) -> dict | None:
    sprint = get_sprint_by_id(sprint_id)
    if sprint is None:
        return None

    issues = get_sprint_issues(sprint_id)
    return _build_kanban_board(sprint.project_id, issues, sprint=sprint)


def select_project_kanban_board(project_id: UUID) -> dict:
    board = get_project_kanban(project_id)
    return {
        "project_id": project_id,
        "columns": [
            {
                "status_id": column["status"].id,
                "status_slug": status_slug(
                    name=column["status"].name,
                    category=column["status"].category,
                ),
                "status_name": column["status"].name,
                "issues": column["issues"],
            }
            for column in board["columns"]
        ],
    }
