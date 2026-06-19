import pytest

from apps.projects.services import archive_project
from apps.sprints.models import Sprint, SprintStatus


@pytest.mark.django_db
def test_create_issue_success(superuser_client, project, issue_payload):
    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        issue_payload,
        format="json",
    )

    assert response.status_code == 201
    issue = response.json()["data"]["issue"]
    assert issue["key"] == "HRMS-1"
    assert issue["title"] == issue_payload["title"]
    assert issue["status"]["slug"] == "todo"


@pytest.mark.django_db
def test_create_issue_archived_project_returns_403(
    superuser_client,
    superuser,
    project,
    issue_payload,
):
    archive_project(project_id=project.id, actor=superuser)

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        issue_payload,
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_create_issue_key_generation(superuser_client, project, issue_payload):
    first = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        issue_payload,
        format="json",
    )
    second = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {**issue_payload, "title": "Second issue"},
        format="json",
    )

    assert first.json()["data"]["issue"]["key"] == "HRMS-1"
    assert second.json()["data"]["issue"]["key"] == "HRMS-2"


@pytest.mark.django_db
def test_create_subtask_requires_parent(superuser_client, project, create_test_issue):
    parent = create_test_issue(title="Parent task")

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {
            "title": "Orphan subtask",
            "issue_type": "subtask",
        },
        format="json",
    )

    assert response.status_code == 400

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {
            "title": "Valid subtask",
            "issue_type": "subtask",
            "parent_issue_id": str(parent.id),
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["data"]["issue"]["parent_issue_id"] == str(parent.id)


@pytest.mark.django_db
def test_subtask_same_project_parent_enforcement(
    superuser_client,
    superuser,
    organization,
    project,
    create_test_issue,
):
    from apps.projects.services import create_project

    other_project = create_project(
        organization=organization.id,
        name="Other Project",
        key="OTH",
        slug="other-project",
        creator=superuser,
    )
    foreign_parent = create_test_issue(project_id=other_project.id, title="Foreign parent")

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {
            "title": "Cross-project subtask",
            "issue_type": "subtask",
            "parent_issue_id": str(foreign_parent.id),
        },
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_kanban_api_returns_all_project_issues(
    superuser_client,
    project,
    create_test_issue,
):
    active_sprint = Sprint.objects.create(
        project_id=project.id,
        name="Active Sprint",
        status=SprintStatus.ACTIVE,
    )
    planned_sprint = Sprint.objects.create(project_id=project.id, name="Planned Sprint")
    active_issue = create_test_issue(title="Active sprint card", sprint_id=active_sprint.id)
    planned_issue = create_test_issue(title="Planned sprint card", sprint_id=planned_sprint.id)
    backlog_issue = create_test_issue(title="Backlog card")

    response = superuser_client.get(f"/api/projects/{project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    issue_titles = {
        issue["title"]
        for column in board["columns"]
        for issue in column["issues"]
    }
    assert issue_titles == {
        active_issue.title,
        planned_issue.title,
        backlog_issue.title,
    }
    assert board["selected_sprint"] is None


@pytest.mark.django_db
def test_kanban_api_includes_issues_without_active_sprint(
    superuser_client,
    project,
    create_test_issue,
):
    planned_sprint = Sprint.objects.create(project_id=project.id, name="Planned Sprint")
    planned_issue = create_test_issue(title="Planned sprint card", sprint_id=planned_sprint.id)
    backlog_issue = create_test_issue(title="Backlog card")

    response = superuser_client.get(f"/api/projects/{project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    issue_titles = {
        issue["title"]
        for column in board["columns"]
        for issue in column["issues"]
    }
    assert issue_titles == {planned_issue.title, backlog_issue.title}


@pytest.mark.django_db
def test_assign_issue_success(developer_client, project_with_roles, user, create_test_issue):
    issue = create_test_issue()

    response = developer_client.post(
        f"/api/issues/{issue.id}/assign",
        {"assignee_id": str(user.id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["issue"]["assignee"]["id"] == str(user.id)


@pytest.mark.django_db
def test_viewer_cannot_assign(viewer_client, project_with_roles, user, create_test_issue):
    issue = create_test_issue()

    response = viewer_client.post(
        f"/api/issues/{issue.id}/assign",
        {"assignee_id": str(user.id)},
        format="json",
    )

    assert response.status_code == 403
