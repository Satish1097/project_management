import pytest

from apps.organizations.models import OrganizationRole
from apps.organizations.services.membership_service import add_organization_member
from apps.projects.models import ProjectMember, ProjectRole, ProjectStatus
from apps.projects.exceptions import ProjectArchivedError
from apps.projects.services import archive_project, create_project, update_project
from apps.projects.services.membership_service import add_project_member


@pytest.mark.django_db
def test_archive_project_sets_status_and_archived_at(superuser, organization, project):
    archived = archive_project(project_id=project.id, actor=superuser)

    assert archived.status == ProjectStatus.ARCHIVED
    assert archived.archived_at is not None


@pytest.mark.django_db
def test_update_archived_project_is_read_only(superuser, organization, project):
    archive_project(project_id=project.id, actor=superuser)

    with pytest.raises(ProjectArchivedError):
        update_project(project_id=project.id, actor=superuser, name="Should Fail")


@pytest.mark.django_db
def test_archive_project_api(superuser_client, project):
    response = superuser_client.post(f"/api/projects/{project.id}/archive")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["project"]["status"] == "archived"
    assert body["data"]["project"]["archived_at"] is not None


@pytest.mark.django_db
def test_list_organization_members(superuser_client, organization, other_user, superuser):
    add_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
        added_by=superuser,
    )

    response = superuser_client.get(f"/api/organizations/{organization.id}/members")

    assert response.status_code == 200
    members = response.json()["data"]["members"]
    assert len(members) == 2
    assert any(member["user_id"] == str(other_user.id) for member in members)


@pytest.mark.django_db
def test_update_organization_member_role(
    superuser_client,
    organization,
    other_user,
    superuser,
):
    add_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
        added_by=superuser,
        role=OrganizationRole.MEMBER,
    )

    response = superuser_client.patch(
        f"/api/organizations/{organization.id}/members/{other_user.id}",
        {"role": OrganizationRole.ADMIN},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["member"]["role"] == OrganizationRole.ADMIN


@pytest.mark.django_db
def test_list_project_members(superuser_client, project, other_user, superuser):
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )

    response = superuser_client.get(f"/api/projects/{project.id}/members")

    assert response.status_code == 200
    members = response.json()["data"]["members"]
    assert len(members) == 2
    assert any("email" in member for member in members)


@pytest.mark.django_db
def test_update_project_member_role(superuser_client, project, other_user, superuser):
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )

    response = superuser_client.patch(
        f"/api/projects/{project.id}/members/{other_user.id}",
        {"role": ProjectRole.QA},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["member"]["role"] == ProjectRole.QA


@pytest.mark.django_db
def test_private_project_hidden_from_non_member_org_list(
    api_client,
    organization_with_member,
    user,
    superuser,
    authenticate,
):
    create_project(
        organization=organization_with_member.id,
        name="Private Project",
        key="PRV",
        slug="private-project",
        creator=superuser,
        visibility="private",
    )
    client = authenticate(user)
    response = client.get(f"/api/organizations/{organization_with_member.id}/projects")

    assert response.status_code == 200
    assert response.json()["data"]["projects"] == []


@pytest.mark.django_db
def test_cannot_remove_last_project_admin(superuser_client, project, superuser):
    response = superuser_client.delete(
        f"/api/projects/{project.id}/members/{superuser.id}",
    )

    assert response.status_code == 409
    assert ProjectMember.objects.filter(project_id=project.id, user_id=superuser.id).exists()
