import pytest
from django.utils import timezone
from datetime import timedelta

from apps.issues.models import Issue, StoryPointHistory
from apps.workflow.models import IssueStatusHistory, WorkflowStatus
from apps.sprints.models import SprintSnapshot, SprintIssueCommitment, Sprint
from apps.workflow.services.transition_service import transition_service
from apps.issues.services.issue_service import issue_service
from apps.sprints.services.sprint_service import sprint_service
from apps.projects.models import Project


@pytest.mark.django_db
def test_status_transition_data_collection(create_test_issue, status_ids, superuser):
    issue = create_test_issue()
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    in_progress_status = WorkflowStatus.objects.get(pk=status_ids["in_progress"])
    done_status = WorkflowStatus.objects.get(pk=status_ids["done"])

    # First transition: To Do -> In Progress
    transitioned_at1 = timezone.now() - timedelta(hours=1)
    transition_service.transition_issue(
        user=superuser,
        issue_id=issue.id,
        to_status_id=in_progress_status.id,
    )
    
    # Check that a history record was created
    history1 = IssueStatusHistory.objects.get(issue=issue, to_status=in_progress_status)
    assert history1.from_status_id == todo_status.id
    assert history1.duration_seconds is None
    assert issue.completed_at is None

    # Second transition: In Progress -> Done
    transition_service.transition_issue(
        user=superuser,
        issue_id=issue.id,
        to_status_id=done_status.id,
    )

    # Check first record was closed
    history1.refresh_from_db()
    assert history1.duration_seconds >= 0

    # Check second record was opened
    history2 = IssueStatusHistory.objects.get(issue=issue, to_status=done_status)
    assert history2.from_status_id == in_progress_status.id
    
    # Check completed_at was set
    issue.refresh_from_db()
    assert issue.completed_at is not None

    # Third transition: Done -> In Progress (Reopen)
    transition_service.transition_issue(
        user=superuser,
        issue_id=issue.id,
        to_status_id=in_progress_status.id,
    )
    
    # Check completed_at was cleared
    issue.refresh_from_db()
    assert issue.completed_at is None


@pytest.mark.django_db
def test_story_point_change_data_collection(create_test_issue, superuser):
    # Create issue with no points
    issue = create_test_issue()
    assert issue.story_points is None

    # Update story points
    issue_service.update_issue(
        user=superuser,
        issue_id=issue.id,
        story_points=5,
    )

    # Check StoryPointHistory created
    history1 = StoryPointHistory.objects.get(issue=issue)
    assert history1.previous_story_points is None
    assert history1.new_story_points == 5
    assert history1.changed_by_id == superuser.id

    # Update points again
    issue_service.update_issue(
        user=superuser,
        issue_id=issue.id,
        story_points=8,
    )

    # Check second history created
    histories = StoryPointHistory.objects.filter(issue=issue).order_by("-created_at")
    assert histories.count() == 2
    assert histories[0].previous_story_points == 5
    assert histories[0].new_story_points == 8


@pytest.mark.django_db
def test_sprint_snapshot_data_collection(project, superuser, create_test_issue):
    from apps.projects.models import Project as ProjectModel
    project_obj = ProjectModel.objects.get(pk=project.id)

    sprint = sprint_service.create_sprint(
        user=superuser,
        project_id=project.id,
        name="Sprint 1",
        capacity_points=25,
    )

    issue1 = create_test_issue(story_points=5, sprint_id=sprint.id)
    issue2 = create_test_issue(story_points=8, sprint_id=sprint.id)

    # Start sprint
    sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)

    # Check Start snapshot was created
    snapshot_start = SprintSnapshot.objects.get(sprint=sprint, snapshot_type="start")
    assert snapshot_start.commitments.count() == 2
    
    commitments_start = snapshot_start.commitments.all().order_by("committed_story_points")
    assert commitments_start[0].issue_id == issue1.id
    assert commitments_start[0].committed_story_points == 5
    assert commitments_start[1].issue_id == issue2.id
    assert commitments_start[1].committed_story_points == 8

    # Complete sprint
    sprint_service.complete_sprint(
        user=superuser,
        sprint_id=sprint.id,
        move_incomplete_to="backlog",
    )

    # Check End snapshot was created
    snapshot_end = SprintSnapshot.objects.get(sprint=sprint, snapshot_type="end")
    assert snapshot_end.commitments.count() == 2
    
    # Incomplete issues must be captured in the end snapshot *before* they are reassigned to backlog
    commitments_end = snapshot_end.commitments.all().order_by("committed_story_points")
    assert commitments_end[0].issue_id == issue1.id
    assert commitments_end[1].issue_id == issue2.id
