import pytest

from apps.label.models import Label


LABEL_PAYLOAD = {
    "name": "Bug",
    "color": "#FF0000",
}


@pytest.mark.django_db
def test_list_labels_smoke(manager_client, project_with_manager):
    Label.objects.create(project=project_with_manager, name="Bug", color="#FF0000")
    Label.objects.create(project=project_with_manager, name="Feature", color="#00FF00")

    response = manager_client.get(f"/api/projects/{project_with_manager.id}/labels")

    assert response.status_code == 200
    labels = response.json()["data"]["labels"]
    assert len(labels) == 2


@pytest.mark.django_db
def test_create_label_smoke(manager_client, project_with_manager):
    response = manager_client.post(
        f"/api/projects/{project_with_manager.id}/labels",
        LABEL_PAYLOAD,
        format="json",
    )

    assert response.status_code == 201
    label = response.json()["data"]["label"]
    assert label["name"] == "Bug"
    assert label["color"] == "#FF0000"


@pytest.mark.django_db
def test_update_label_smoke(manager_client, project_with_manager):
    label = Label.objects.create(project=project_with_manager, name="Bug", color="#FF0000")

    response = manager_client.patch(
        f"/api/projects/{project_with_manager.id}/labels/{label.id}",
        {"name": "Critical", "color": "#AA0000"},
        format="json",
    )

    assert response.status_code == 200
    updated = response.json()["data"]["label"]
    assert updated["name"] == "Critical"
    assert updated["color"] == "#AA0000"


@pytest.mark.django_db
def test_archive_label_smoke(manager_client, project_with_manager):
    label = Label.objects.create(project=project_with_manager, name="Bug", color="#FF0000")

    response = manager_client.delete(
        f"/api/projects/{project_with_manager.id}/labels/{label.id}",
    )

    assert response.status_code == 200
    archived = response.json()["data"]["label"]
    assert archived["is_archived"] is True
