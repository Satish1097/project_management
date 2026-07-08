pytest_plugins = ["apps.projects.tests.conftest"]

import pytest
from uuid import uuid4


def _assert_kanban_methodology_error(response):
    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert "Kanban" in body["message"]
    assert body["errors"]["code"] == "methodology_not_supported"


@pytest.mark.django_db
def test_kanban_project_cannot_get_backlog_metadata(
    superuser_client,
    kanban_project,
):
    response = superuser_client.get(f"/api/projects/{kanban_project.id}/backlog")

    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_get_backlog_issues(
    superuser_client,
    kanban_project,
):
    response = superuser_client.get(
        f"/api/projects/{kanban_project.id}/backlog/issues",
        {"page": 1, "page_size": 15},
    )

    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_get_backlog_sprint_issues(
    superuser_client,
    kanban_project,
):
    response = superuser_client.get(
        f"/api/projects/{kanban_project.id}/backlog/sprints/{uuid4()}/issues",
        {"page": 1, "page_size": 15},
    )

    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_scrum_backlog_metadata_unchanged(superuser_client, project):
    response = superuser_client.get(f"/api/projects/{project.id}/backlog")

    assert response.status_code == 200
    backlog = response.json()["data"]["backlog"]
    assert backlog["project_id"] == str(project.id)
    assert backlog["backlog_issue_count"] == 0
    assert backlog["sprints"] == []
