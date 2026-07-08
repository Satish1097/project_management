import pytest
from django.apps import apps
from django.utils import timezone
from datetime import timedelta

from apps.issues.models import Issue, StoryPointHistory
from apps.workflow.models import IssueStatusHistory, WorkflowStatus
from apps.sprints.models import SprintSnapshot, SprintIssueCommitment, Sprint
from apps.issues.models import IssueActivity, IssueActivityEventType
import importlib
backfill_analytics = importlib.import_module("apps.issues.migrations.0010_backfill_analytics")
backfill_analytics_data = backfill_analytics.backfill_analytics_data


@pytest.mark.django_db
def test_completed_at_field_read_write(create_test_issue):
    issue = create_test_issue()
    assert issue.completed_at is None

    now = timezone.now()
    issue.completed_at = now
    issue.save()

    refreshed = Issue.objects.get(pk=issue.pk)
    assert refreshed.completed_at == now


@pytest.mark.django_db
def test_story_point_history_model(create_test_issue, superuser):
    issue = create_test_issue()
    history = StoryPointHistory.objects.create(
        issue=issue,
        previous_story_points=5,
        new_story_points=8,
        changed_by=superuser,
    )

    assert history.issue_id == issue.id
    assert history.previous_story_points == 5
    assert history.new_story_points == 8
    assert history.changed_by_id == superuser.id
    assert history.created_at is not None


@pytest.mark.django_db
def test_issue_status_history_model(create_test_issue, status_ids, superuser):
    issue = create_test_issue()
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    in_progress_status = WorkflowStatus.objects.get(pk=status_ids["in_progress"])

    history = IssueStatusHistory.objects.create(
        issue=issue,
        from_status=todo_status,
        to_status=in_progress_status,
        transitioned_by=superuser,
        duration_seconds=3600,
    )

    assert history.issue_id == issue.id
    assert history.from_status_id == todo_status.id
    assert history.to_status_id == in_progress_status.id
    assert history.transitioned_by_id == superuser.id
    assert history.duration_seconds == 3600


@pytest.mark.django_db
def test_sprint_snapshot_models(project, superuser, create_test_issue, status_ids):
    from apps.projects.models import Project
    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Test Sprint",
        capacity_points=20,
    )
    issue = create_test_issue()
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])

    snapshot = SprintSnapshot.objects.create(
        sprint=sprint,
        snapshot_type="start",
    )
    commitment = SprintIssueCommitment.objects.create(
        snapshot=snapshot,
        issue=issue,
        committed_story_points=5,
        committed_estimate=10.5,
        committed_status=todo_status,
    )

    assert snapshot.sprint_id == sprint.id
    assert snapshot.snapshot_type == "start"
    assert commitment.snapshot_id == snapshot.id
    assert commitment.issue_id == issue.id
    assert commitment.committed_story_points == 5
    assert commitment.committed_estimate == 10.5
    assert commitment.committed_status_id == todo_status.id


@pytest.mark.django_db
def test_analytics_backfill_migration(project, superuser, create_test_issue, status_ids):
    # Setup statuses
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    in_progress_status = WorkflowStatus.objects.get(pk=status_ids["in_progress"])
    done_status = WorkflowStatus.objects.get(pk=status_ids["done"])

    # Issue 1: Transitions to Done, has activities
    issue1 = create_test_issue(story_points=8)
    issue1.status = done_status
    issue1.save()
    
    # Issue 2: Transitions to Done, no activities (fallback case)
    issue2 = create_test_issue(story_points=5)
    issue2.status = done_status
    issue2.save()

    # Issue 3: In Progress (not done)
    issue3 = create_test_issue(story_points=3)
    issue3.status = in_progress_status
    issue3.save()

    # Create status changed activities for Issue 1
    now = timezone.now()
    
    # 1. To Do -> In Progress
    act1 = IssueActivity.objects.create(
        issue=issue1,
        actor=superuser,
        event_type=IssueActivityEventType.STATUS_CHANGED,
        old_value="To Do",
        new_value="In Progress",
    )
    activity1_time = now - timedelta(hours=4)
    IssueActivity.objects.filter(pk=act1.pk).update(created_at=activity1_time)

    # 2. In Progress -> Done
    act2 = IssueActivity.objects.create(
        issue=issue1,
        actor=superuser,
        event_type=IssueActivityEventType.STATUS_CHANGED,
        old_value="In Progress",
        new_value="Done",
    )
    activity2_time = now - timedelta(hours=2)
    IssueActivity.objects.filter(pk=act2.pk).update(created_at=activity2_time)
    act2.refresh_from_db()

    # Clear completed_at to test backfill (mimicking fresh state before migration)
    Issue.objects.all().update(completed_at=None)
    IssueStatusHistory.objects.all().delete()

    # Run data backfill
    backfill_analytics_data(apps, None)

    # Refresh
    issue1.refresh_from_db()
    issue2.refresh_from_db()
    issue3.refresh_from_db()

    # Verify completed_at is set correctly
    assert issue1.completed_at == act2.created_at
    assert issue2.completed_at is not None  # Fallback to updated_at
    assert issue3.completed_at is None

    # Verify IssueStatusHistory records were created
    histories1 = IssueStatusHistory.objects.filter(issue=issue1).order_by("transitioned_at")
    assert histories1.count() == 2
    
    # Todo -> In Progress transition
    assert histories1[0].from_status_id == todo_status.id
    assert histories1[0].to_status_id == in_progress_status.id
    assert histories1[0].duration_seconds is not None  # Should have computed duration
    assert histories1[0].duration_seconds > 0
    
    # In Progress -> Done transition
    assert histories1[1].from_status_id == in_progress_status.id
    assert histories1[1].to_status_id == done_status.id
    assert histories1[1].duration_seconds is None  # Final transition duration is null
