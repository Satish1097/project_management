from uuid import UUID
from django.db import models
from apps.sprints.models import Sprint, SprintSnapshot, SprintIssueCommitment
from apps.issues.models import Issue, StoryPointHistory, IssueActivity, IssueActivityEventType
from apps.workflow.models import IssueStatusHistory


def get_sprint_data_for_burndown(sprint_id: UUID) -> dict | None:
    """
    Fetches all raw database records required to calculate a sprint burndown.
    Performs exactly 5 main database queries, avoiding N+1.
    """
    try:
        sprint = Sprint.objects.select_related("project").get(pk=sprint_id)
    except Sprint.DoesNotExist:
        return None

    # 1. Fetch snapshot & commitments
    start_snapshot = SprintSnapshot.objects.filter(
        sprint=sprint,
        snapshot_type="start"
    ).first()

    commitments = []
    if start_snapshot:
        commitments = list(
            SprintIssueCommitment.objects.filter(snapshot=start_snapshot)
            .select_related("committed_status")
        )

    # 2. Identify all issue IDs ever associated with the sprint
    current_issue_ids = list(
        Issue.objects.filter(sprint_id=sprint.id).values_list("id", flat=True)
    )

    committed_issue_ids = [c.issue_id for c in commitments]

    # Sprint name for activity lookup
    sprint_name = sprint.name

    # SPRINT_CHANGED activities to find issues added/removed
    activity_issue_ids = list(
        IssueActivity.objects.filter(
            event_type=IssueActivityEventType.SPRINT_CHANGED,
            issue__project_id=sprint.project_id
        )
        .filter(models.Q(old_value=sprint_name) | models.Q(new_value=sprint_name))
        .values_list("issue_id", flat=True)
    )

    all_issue_ids = list(set(current_issue_ids + committed_issue_ids + activity_issue_ids))

    # 3. Retrieve issues with status pre-fetched
    issues = list(
        Issue.objects.filter(id__in=all_issue_ids).select_related("status")
    )

    # 4. Retrieve status transitions
    status_histories = list(
        IssueStatusHistory.objects.filter(issue_id__in=all_issue_ids)
        .select_related("to_status")
        .order_by("transitioned_at")
    )

    # 5. Retrieve story point changes
    story_point_histories = list(
        StoryPointHistory.objects.filter(issue_id__in=all_issue_ids)
        .order_by("created_at")
    )

    # 6. Retrieve activities
    activities = list(
        IssueActivity.objects.filter(
            issue_id__in=all_issue_ids,
            event_type=IssueActivityEventType.SPRINT_CHANGED
        ).order_by("created_at")
    )

    return {
        "sprint": sprint,
        "start_snapshot": start_snapshot,
        "commitments": commitments,
        "issues": issues,
        "status_histories": status_histories,
        "story_point_histories": story_point_histories,
        "activities": activities,
    }


def get_sprint_data_for_sprint_report(sprint_id: UUID) -> dict | None:
    """
    Fetches all raw database records required to calculate a sprint report.
    Performs exactly 9 main database queries, avoiding N+1.

    Compared to burndown (7 queries), adds 2 queries for end snapshot + end commitments
    needed for carry-over classification and completed sprint frozen state.
    """
    try:
        sprint = Sprint.objects.select_related("project").get(pk=sprint_id)
    except Sprint.DoesNotExist:
        return None

    # 1. Start snapshot & commitments
    start_snapshot = SprintSnapshot.objects.filter(
        sprint=sprint,
        snapshot_type="start"
    ).first()

    start_commitments = []
    if start_snapshot:
        start_commitments = list(
            SprintIssueCommitment.objects.filter(snapshot=start_snapshot)
            .select_related("committed_status")
        )

    # 2. End snapshot & commitments
    end_snapshot = SprintSnapshot.objects.filter(
        sprint=sprint,
        snapshot_type="end"
    ).first()

    end_commitments = []
    if end_snapshot:
        end_commitments = list(
            SprintIssueCommitment.objects.filter(snapshot=end_snapshot)
            .select_related("committed_status")
        )

    # 3. Identify all issue IDs ever associated with the sprint
    current_issue_ids = list(
        Issue.objects.filter(sprint_id=sprint.id).values_list("id", flat=True)
    )

    start_committed_ids = [c.issue_id for c in start_commitments]
    end_committed_ids = [c.issue_id for c in end_commitments]

    sprint_name = sprint.name

    activity_issue_ids = list(
        IssueActivity.objects.filter(
            event_type=IssueActivityEventType.SPRINT_CHANGED,
            issue__project_id=sprint.project_id
        )
        .filter(models.Q(old_value=sprint_name) | models.Q(new_value=sprint_name))
        .values_list("issue_id", flat=True)
    )

    all_issue_ids = list(set(
        current_issue_ids + start_committed_ids + end_committed_ids + activity_issue_ids
    ))

    # 4. Issues with status pre-fetched
    issues = list(
        Issue.objects.filter(id__in=all_issue_ids).select_related("status")
    )

    # 5. Status transitions (ordered ascending for history traversal)
    status_histories = list(
        IssueStatusHistory.objects.filter(issue_id__in=all_issue_ids)
        .select_related("to_status")
        .order_by("transitioned_at")
    )

    # 6. Story point changes (ordered ascending)
    story_point_histories = list(
        StoryPointHistory.objects.filter(issue_id__in=all_issue_ids)
        .order_by("created_at")
    )

    # 7. Sprint change activities (ordered ascending)
    activities = list(
        IssueActivity.objects.filter(
            issue_id__in=all_issue_ids,
            event_type=IssueActivityEventType.SPRINT_CHANGED
        ).order_by("created_at")
    )

    return {
        "sprint": sprint,
        "start_snapshot": start_snapshot,
        "end_snapshot": end_snapshot,
        "start_commitments": start_commitments,
        "end_commitments": end_commitments,
        "issues": issues,
        "status_histories": status_histories,
        "story_point_histories": story_point_histories,
        "activities": activities,
    }


def get_velocity_data_for_sprints(sprints) -> list[dict]:
    """
    Fetches raw database records required to calculate velocity for a list of sprints.
    Performs exactly 2 database queries to fetch all snapshots and commitments in bulk.
    """
    if not sprints:
        return []

    sprint_ids = [s.id for s in sprints]

    # 1. Fetch all snapshots
    snapshots = list(SprintSnapshot.objects.filter(sprint_id__in=sprint_ids))
    snapshot_ids = [s.id for s in snapshots]

    # 2. Fetch all commitments
    commitments = list(
        SprintIssueCommitment.objects.filter(snapshot_id__in=snapshot_ids)
        .select_related("committed_status")
    )

    # Build lookup dictionaries
    snapshots_by_sprint = {}
    for s in snapshots:
        snapshots_by_sprint.setdefault(s.sprint_id, {})[s.snapshot_type] = s

    commitments_by_snapshot = {}
    for c in commitments:
        commitments_by_snapshot.setdefault(c.snapshot_id, []).append(c)

    # Assemble results in the same order as input sprints
    results = []
    for sprint in sprints:
        snaps = snapshots_by_sprint.get(sprint.id, {})
        start_snap = snaps.get("start")
        end_snap = snaps.get("end")

        start_comm = commitments_by_snapshot.get(start_snap.id, []) if start_snap else []
        end_comm = commitments_by_snapshot.get(end_snap.id, []) if end_snap else []

        results.append({
            "sprint": sprint,
            "start_snapshot": start_snap,
            "end_snapshot": end_snap,
            "start_commitments": start_comm,
            "end_commitments": end_comm,
        })
        
    return results
