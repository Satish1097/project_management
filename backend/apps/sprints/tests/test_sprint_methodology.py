pytest_plugins = ["apps.projects.tests.conftest"]


import pytest

from apps.projects.exceptions import ProjectMethodologyError
from apps.sprints.models import Sprint
from apps.sprints.services.sprint_service import sprint_service

SPRINT_PAYLOAD = {
    "name": "Sprint 1",
    "goal": "Delivery",
    "start_date": "2026-06-10",
    "end_date": "2026-06-24",
}


def _assert_kanban_methodology_error(response):
    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert "Kanban" in body["message"]
    assert body["errors"]["code"] == "methodology_not_supported"


@pytest.mark.django_db
def test_kanban_project_cannot_list_sprints(
    manager_client,
    kanban_project_with_manager,
):
    response = manager_client.get(
        f"/api/projects/{kanban_project_with_manager.id}/sprints",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_create_sprint(
    manager_client,
    kanban_project_with_manager,
):
    response = manager_client.post(
        f"/api/projects/{kanban_project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_update_sprint(
    manager_client,
    kanban_project_with_manager,
    superuser,
):
    sprint = Sprint.objects.create(
        project_id=kanban_project_with_manager.id,
        name="Legacy Sprint",
    )

    response = manager_client.patch(
        f"/api/projects/{kanban_project_with_manager.id}/sprints/{sprint.id}",
        {"name": "Updated Sprint"},
        format="json",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_start_sprint(
    manager_client,
    kanban_project_with_manager,
):
    sprint = Sprint.objects.create(
        project_id=kanban_project_with_manager.id,
        name="Legacy Sprint",
    )

    response = manager_client.post(
        f"/api/projects/{kanban_project_with_manager.id}/sprints/{sprint.id}/start",
        format="json",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_pause_sprint(
    manager_client,
    kanban_project_with_manager,
):
    sprint = Sprint.objects.create(
        project_id=kanban_project_with_manager.id,
        name="Legacy Sprint",
        status="active",
    )

    response = manager_client.post(
        f"/api/projects/{kanban_project_with_manager.id}/sprints/{sprint.id}/pause",
        format="json",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_resume_sprint(
    manager_client,
    kanban_project_with_manager,
):
    sprint = Sprint.objects.create(
        project_id=kanban_project_with_manager.id,
        name="Legacy Sprint",
        status="paused",
    )

    response = manager_client.post(
        f"/api/projects/{kanban_project_with_manager.id}/sprints/{sprint.id}/resume",
        format="json",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_kanban_project_cannot_complete_sprint(
    manager_client,
    kanban_project_with_manager,
):
    sprint = Sprint.objects.create(
        project_id=kanban_project_with_manager.id,
        name="Legacy Sprint",
        status="active",
    )

    response = manager_client.post(
        f"/api/projects/{kanban_project_with_manager.id}/sprints/{sprint.id}/complete",
        format="json",
    )
    _assert_kanban_methodology_error(response)


@pytest.mark.django_db
def test_scrum_sprint_lifecycle_unchanged(manager_client, project_with_manager):
    create = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    assert create.status_code == 201
    sprint_id = create.json()["data"]["sprint"]["id"]

    start = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/start",
        format="json",
    )
    assert start.status_code == 200
    assert start.json()["data"]["sprint"]["status"] == "active"

    pause = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/pause",
        format="json",
    )
    assert pause.status_code == 200
    assert pause.json()["data"]["sprint"]["status"] == "paused"

    resume = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/resume",
        format="json",
    )
    assert resume.status_code == 200
    assert resume.json()["data"]["sprint"]["status"] == "active"

    complete = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/complete",
        format="json",
    )
    assert complete.status_code == 200
    assert complete.json()["data"]["sprint"]["status"] == "completed"


@pytest.mark.django_db
def test_kanban_service_create_sprint_rejected_before_permissions(
    kanban_project_with_manager,
    project_manager_user,
):
    with pytest.raises(ProjectMethodologyError, match="Kanban"):
        sprint_service.create_sprint(
            user=project_manager_user,
            project_id=kanban_project_with_manager.id,
            name="Blocked Sprint",
        )
