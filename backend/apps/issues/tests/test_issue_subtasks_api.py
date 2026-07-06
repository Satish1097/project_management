import pytest


@pytest.mark.django_db
def test_list_and_create_subtasks(superuser_client, project, create_test_issue):
    parent = create_test_issue(title="Parent task")

    list_response = superuser_client.get(f"/api/issues/{parent.id}/subtasks")
    assert list_response.status_code == 200
    assert list_response.json()["data"]["subtasks"] == []

    create_response = superuser_client.post(
        f"/api/issues/{parent.id}/subtasks",
        {"title": "First subtask"},
        format="json",
    )
    assert create_response.status_code == 201
    created = create_response.json()["data"]["subtask"]
    assert created["title"] == "First subtask"
    assert created["done"] is False

    list_response = superuser_client.get(f"/api/issues/{parent.id}/subtasks")
    assert list_response.status_code == 200
    subtasks = list_response.json()["data"]["subtasks"]
    assert len(subtasks) == 1
    assert subtasks[0]["id"] == created["id"]


@pytest.mark.django_db
def test_update_subtask_done_toggle(superuser_client, project, create_test_issue):
    parent = create_test_issue(title="Parent task")
    create_response = superuser_client.post(
        f"/api/issues/{parent.id}/subtasks",
        {"title": "Toggle me"},
        format="json",
    )
    subtask_id = create_response.json()["data"]["subtask"]["id"]

    done_response = superuser_client.patch(
        f"/api/subtasks/{subtask_id}",
        {"done": True},
        format="json",
    )
    assert done_response.status_code == 200
    assert done_response.json()["data"]["subtask"]["done"] is True

    todo_response = superuser_client.patch(
        f"/api/subtasks/{subtask_id}",
        {"done": False},
        format="json",
    )
    assert todo_response.status_code == 200
    assert todo_response.json()["data"]["subtask"]["done"] is False


@pytest.mark.django_db
def test_delete_subtask(superuser_client, project, create_test_issue):
    parent = create_test_issue(title="Parent task")
    create_response = superuser_client.post(
        f"/api/issues/{parent.id}/subtasks",
        {"title": "Delete me"},
        format="json",
    )
    subtask_id = create_response.json()["data"]["subtask"]["id"]

    delete_response = superuser_client.delete(f"/api/subtasks/{subtask_id}")
    assert delete_response.status_code == 204

    list_response = superuser_client.get(f"/api/issues/{parent.id}/subtasks")
    assert list_response.json()["data"]["subtasks"] == []


@pytest.mark.django_db
def test_subtasks_excluded_from_issue_list(superuser_client, project, create_test_issue):
    parent = create_test_issue(title="Parent task")
    superuser_client.post(
        f"/api/issues/{parent.id}/subtasks",
        {"title": "Hidden subtask"},
        format="json",
    )

    list_response = superuser_client.get(
        f"/api/issues",
        {"project": str(project.id)},
    )
    assert list_response.status_code == 200
    titles = [issue["title"] for issue in list_response.json()["data"]["issues"]]
    assert titles == ["Parent task"]
