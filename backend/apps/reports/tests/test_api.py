import pytest
from django.urls import reverse
from rest_framework import status
from apps.sprints.models import Sprint, SprintStatus, SprintSnapshot, SprintIssueCommitment
from apps.projects.models import Project


@pytest.mark.django_db
def test_burndown_endpoint_anonymous(api_client, project):
    """Anonymous requests should return 401."""
    url = reverse("project-report-burndown", kwargs={"project_id": project.id})
    res = api_client.get(url)
    assert res.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_burndown_endpoint_non_member(other_user, authenticate, api_client, project):
    """Users who are not members of the project should return 403."""
    url = reverse("project-report-burndown", kwargs={"project_id": project.id})
    client = authenticate(other_user)
    res = client.get(url)
    assert res.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_burndown_endpoint_kanban_project(superuser_client, kanban_project):
    """Kanban projects should reject burndown queries with 400."""
    url = reverse("project-report-burndown", kwargs={"project_id": kanban_project.id})
    res = superuser_client.get(url)
    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "Sprint operations are not supported" in res.data["message"]


@pytest.mark.django_db
def test_burndown_endpoint_success_empty(developer_client, project):
    """Scrum project with no sprints should return empty burndown DTO."""
    url = reverse("project-report-burndown", kwargs={"project_id": project.id})
    res = developer_client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert res.data["success"] is True
    report = res.data["data"]["report"]
    assert report["sprint_id"] is None
    assert report["committed_points"] == 0
    assert report["data_points"] == []


@pytest.mark.django_db
def test_burndown_endpoint_with_sprint(developer_client, project, superuser, create_test_issue, status_ids):
    """Scrum project with active sprint and issues should return real metrics."""
    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Sprint 1",
        start_date="2026-07-01",
        end_date="2026-07-10",
        status=SprintStatus.ACTIVE,
    )
    
    # Create issue inside sprint
    issue = create_test_issue(sprint_id=sprint.id, story_points=5)

    # Capture start snapshot
    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type="start")
    from apps.workflow.models import WorkflowStatus
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    SprintIssueCommitment.objects.create(
        snapshot=snapshot,
        issue=issue,
        committed_story_points=5,
        committed_status=todo_status,
    )

    url = reverse("project-report-burndown", kwargs={"project_id": project.id})
    res = developer_client.get(f"{url}?sprint_id={sprint.id}")
    assert res.status_code == status.HTTP_200_OK
    
    report = res.data["data"]["report"]
    assert report["sprint_id"] == str(sprint.id)
    assert report["committed_points"] == 5
    assert len(report["data_points"]) > 0
