import pytest

from apps.projects.models import ProjectMember, ProjectRole


@pytest.mark.django_db
def test_add_project_member_success(superuser_client, project, other_user):
    response = superuser_client.post(
        f"/api/projects/{project.id}/members",
        {"user_id": str(other_user.id), "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 201
    member = response.json()["data"]["member"]
    assert member["user_id"] == str(other_user.id)
    assert member["role"] == ProjectRole.DEVELOPER


@pytest.mark.django_db
def test_add_project_member_duplicate_blocked(superuser_client, project, other_user):
    payload = {"user_id": str(other_user.id), "role": ProjectRole.DEVELOPER}
    first = superuser_client.post(
        f"/api/projects/{project.id}/members",
        payload,
        format="json",
    )
    assert first.status_code == 201

    second = superuser_client.post(
        f"/api/projects/{project.id}/members",
        payload,
        format="json",
    )

    assert second.status_code == 409
    assert second.json()["success"] is False


@pytest.mark.django_db
def test_remove_project_member_success(superuser_client, project, other_user):
    superuser_client.post(
        f"/api/projects/{project.id}/members",
        {"user_id": str(other_user.id)},
        format="json",
    )

    response = superuser_client.delete(
        f"/api/projects/{project.id}/members/{other_user.id}",
    )

    assert response.status_code == 200
    assert not ProjectMember.objects.filter(
        project_id=project.id,
        user_id=other_user.id,
    ).exists()
