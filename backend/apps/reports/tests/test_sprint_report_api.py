"""
Integration tests for the Sprint Report API endpoint.

Validates authentication, methodology gating, empty state, and data responses.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from apps.sprints.models import Sprint, SprintStatus, SprintSnapshot, SprintIssueCommitment
from apps.projects.models import Project


@pytest.mark.django_db
def test_sprint_report_anonymous(api_client, project):
    """Anonymous requests should return 401."""
    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})
    res = api_client.get(url)
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_sprint_report_non_member(other_user, authenticate, api_client, project):
    """Users who are not members of the project should return 403."""
    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})
    client = authenticate(other_user)
    res = client.get(url)
    assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_sprint_report_kanban_project(superuser_client, kanban_project):
    """Kanban projects should reject sprint report queries with 400."""
    url = reverse("project-report-sprint-report", kwargs={"project_id": kanban_project.id})
    res = superuser_client.get(url)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Sprint operations are not supported" in res.data["message"]


@pytest.mark.django_db
def test_sprint_report_empty_project(developer_client, project):
    """Scrum project with no sprints should return empty sprint report DTO."""
    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})
    res = developer_client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert res.data["success"] is True
    report = res.data["data"]["report"]
    assert report["sprint_id"] is None
    assert report["summary"]["committed_issues"] == 0
    assert report["completed"] == []
    assert report["incomplete"] == []
    assert report["carry_over"] == []


@pytest.mark.django_db
def test_sprint_report_with_sprint_data(developer_client, project, superuser, create_test_issue, status_ids):
    """Scrum project with active sprint and issues should return a populated sprint report."""
    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Sprint 1",
        start_date="2026-07-01",
        end_date="2026-07-10",
        status=SprintStatus.ACTIVE,
    )

    # Create issues inside the sprint
    issue1 = create_test_issue(sprint_id=sprint.id, story_points=5)
    issue2 = create_test_issue(sprint_id=sprint.id, story_points=3)

    # Capture start snapshot
    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type="start")
    from apps.workflow.models import WorkflowStatus
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    SprintIssueCommitment.objects.create(
        snapshot=snapshot, issue=issue1,
        committed_story_points=5, committed_status=todo_status,
    )
    SprintIssueCommitment.objects.create(
        snapshot=snapshot, issue=issue2,
        committed_story_points=3, committed_status=todo_status,
    )

    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})
    res = developer_client.get(f"{url}?sprint_id={sprint.id}")
    assert res.status_code == status.HTTP_200_OK

    report = res.data["data"]["report"]
    assert report["sprint_id"] == str(sprint.id)
    assert report["sprint_name"] == "Sprint 1"
    assert report["summary"]["committed_issues"] == 2
    assert report["summary"]["committed_story_points"] == 8

    # Both issues are TODO (not completed), so they should be incomplete
    assert report["summary"]["incomplete_issues"] == 2
    assert report["summary"]["completed_issues"] == 0

    # Verify sections exist
    assert isinstance(report["completed"], list)
    assert isinstance(report["incomplete"], list)
    assert isinstance(report["added"], list)
    assert isinstance(report["removed"], list)
    assert isinstance(report["carry_over"], list)
    assert isinstance(report["scope_change"], dict)


@pytest.mark.django_db
def test_sprint_report_response_structure(developer_client, project, superuser, create_test_issue, status_ids):
    """Verify the full response contract matches the documented API spec."""
    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Sprint Struct",
        start_date="2026-07-01",
        end_date="2026-07-10",
        status=SprintStatus.ACTIVE,
    )

    issue = create_test_issue(sprint_id=sprint.id, story_points=5)

    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type="start")
    from apps.workflow.models import WorkflowStatus
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    SprintIssueCommitment.objects.create(
        snapshot=snapshot, issue=issue,
        committed_story_points=5, committed_status=todo_status,
    )

    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})
    res = developer_client.get(f"{url}?sprint_id={sprint.id}")
    assert res.status_code == status.HTTP_200_OK

    report = res.data["data"]["report"]

    # Top-level keys
    assert "sprint_id" in report
    assert "sprint_name" in report
    assert "sprint_status" in report
    assert "start_date" in report
    assert "end_date" in report

    # Summary keys
    summary = report["summary"]
    expected_summary_keys = {
        "committed_issues", "committed_story_points",
        "completed_issues", "completed_story_points",
        "incomplete_issues", "incomplete_story_points",
        "added_issues", "added_story_points",
        "removed_issues", "removed_story_points",
        "carry_over_issues", "carry_over_story_points",
        "completion_percentage", "story_point_completion_percentage",
    }
    assert set(summary.keys()) == expected_summary_keys

    # Scope change keys
    scope = report["scope_change"]
    expected_scope_keys = {
        "issues_added", "issues_removed",
        "points_added", "points_removed",
        "net_issues", "net_story_points",
    }
    assert set(scope.keys()) == expected_scope_keys
