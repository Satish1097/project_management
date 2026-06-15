import pytest

from apps.projects.services import archive_project


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
