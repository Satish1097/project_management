import pytest

from apps.projects.models import ProjectMember, ProjectRole

PROJECT_PAYLOAD = {
    "key": "HRMS",
    "slug": "hrms",
    "name": "HR Management System",
    "description": "",
    "visibility": "organization",
}


@pytest.mark.django_db
def test_create_project_org_admin_success(organization_admin_client, organization):
    response = organization_admin_client.post(
        f"/api/organizations/{organization.id}/projects",
        PROJECT_PAYLOAD,
        format="json",
    )

    assert response.status_code == 201
    project = response.json()["data"]["project"]
    assert project["key"] == "HRMS"
    assert project["slug"] == "hrms"
    assert project["organization_id"] == str(organization.id)


@pytest.mark.django_db
def test_create_project_org_owner_success(superuser_client, organization):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        PROJECT_PAYLOAD,
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["success"] is True


@pytest.mark.django_db
def test_create_project_org_member_success(org_member_client, organization):
    response = org_member_client.post(
        f"/api/organizations/{organization.id}/projects",
        PROJECT_PAYLOAD,
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["success"] is True


@pytest.mark.django_db
def test_create_project_non_member_forbidden(api_client, organization, authenticate, other_user):
    client = authenticate(other_user)
    response = client.post(
        f"/api/organizations/{organization.id}/projects",
        PROJECT_PAYLOAD,
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_create_project_creator_auto_added_as_project_admin(
    superuser_client,
    organization,
    superuser,
):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        PROJECT_PAYLOAD,
        format="json",
    )

    assert response.status_code == 201
    project_data = response.json()["data"]["project"]
    assert project_data["lead_user_id"] == str(superuser.id)
    project_id = project_data["id"]
    membership = ProjectMember.objects.get(project_id=project_id, user_id=superuser.id)
    assert membership.role == ProjectRole.PROJECT_ADMIN


@pytest.mark.django_db
def test_create_project_duplicate_key_returns_409(superuser_client, organization, project):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        {
            "key": project.key,
            "slug": "another-slug",
            "name": "Duplicate Key Project",
            "visibility": "organization",
        },
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_create_project_duplicate_slug_returns_409(superuser_client, organization, project):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        {
            "key": "NEWKEY",
            "slug": project.slug,
            "name": "Duplicate Slug Project",
            "visibility": "organization",
        },
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_create_project_ignores_lead_and_member_selection_fields(
    superuser_client,
    organization,
    user,
    superuser,
):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        {
            **PROJECT_PAYLOAD,
            "key": "TEAM",
            "slug": "team-project",
            "name": "Team Project",
            "lead_user_id": str(user.id),
            "member_ids": [str(user.id)],
        },
        format="json",
    )

    assert response.status_code == 201
    project = response.json()["data"]["project"]
    assert project["lead_user_id"] == str(superuser.id)
    member_ids = {member["user_id"] for member in project["members"]}
    assert str(superuser.id) in member_ids
    assert str(user.id) not in member_ids


@pytest.mark.django_db
def test_update_project_admin_success(superuser_client, project):
    response = superuser_client.patch(
        f"/api/projects/{project.id}",
        {"name": "Updated Project Name"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["project"]["name"] == "Updated Project Name"


@pytest.mark.django_db
def test_update_project_manager_success(manager_client, project_with_manager):
    response = manager_client.patch(
        f"/api/projects/{project_with_manager.id}",
        {"description": "Managed update"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["project"]["description"] == "Managed update"


@pytest.mark.django_db
def test_update_project_developer_forbidden(developer_client, project_with_roles):
    response = developer_client.patch(
        f"/api/projects/{project_with_roles.id}",
        {"name": "Developer Edit"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_update_project_viewer_forbidden(viewer_client, project_with_roles):
    response = viewer_client.patch(
        f"/api/projects/{project_with_roles.id}",
        {"name": "Viewer Edit"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_update_project_lead_must_be_member(superuser_client, project, other_user):
    response = superuser_client.patch(
        f"/api/projects/{project.id}",
        {"lead_user_id": str(other_user.id)},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_update_project_lead_existing_member_success(
    superuser_client,
    project_with_roles,
    organization_with_member,
    user,
):
    response = superuser_client.patch(
        f"/api/projects/{project_with_roles.id}",
        {"lead_user_id": str(user.id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["project"]["lead_user_id"] == str(user.id)


@pytest.mark.django_db
def test_update_project_members_and_lead_syncs_membership(
    superuser_client,
    project,
    organization_with_member,
    user,
    superuser,
):
    response = superuser_client.patch(
        f"/api/projects/{project.id}",
        {
            "lead_user_id": str(user.id),
            "member_ids": [str(user.id)],
        },
        format="json",
    )

    assert response.status_code == 200
    data = response.json()["data"]["project"]
    assert data["lead_user_id"] == str(user.id)
    member_ids = {member["user_id"] for member in data["members"]}
    assert str(user.id) in member_ids
    assert str(superuser.id) in member_ids
    assert ProjectMember.objects.filter(project_id=project.id, user_id=user.id).exists()

    remove_response = superuser_client.patch(
        f"/api/projects/{project.id}",
        {
            "lead_user_id": None,
            "member_ids": [],
        },
        format="json",
    )
    assert remove_response.status_code == 200
    assert not ProjectMember.objects.filter(project_id=project.id, user_id=user.id).exists()
    assert ProjectMember.objects.filter(project_id=project.id, user_id=superuser.id).exists()


@pytest.mark.django_db
def test_list_organization_projects(superuser_client, organization, project):
    response = superuser_client.get(
        f"/api/organizations/{organization.id}/projects",
    )

    assert response.status_code == 200
    projects = response.json()["data"]["projects"]
    assert len(projects) == 1
    assert projects[0]["id"] == str(project.id)
    assert projects[0]["methodology"] == "scrum"
    assert projects[0]["board_type"] == "scrum"


@pytest.mark.django_db
def test_get_project_detail_includes_methodology(superuser_client, project):
    response = superuser_client.get(f"/api/projects/{project.id}")

    assert response.status_code == 200
    project_data = response.json()["data"]["project"]
    assert project_data["methodology"] == "scrum"
    assert project_data["board_type"] == "scrum"
    assert project_data["default_sprint_weeks"] == 2


@pytest.mark.django_db
def test_create_project_kanban_methodology(superuser_client, organization):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        {
            **PROJECT_PAYLOAD,
            "key": "KANB",
            "slug": "kanban-board",
            "name": "Kanban Board",
            "methodology": "kanban",
        },
        format="json",
    )

    assert response.status_code == 201
    project = response.json()["data"]["project"]
    assert project["methodology"] == "kanban"
    assert project["board_type"] == "kanban"
    assert "default_sprint_weeks" not in project


@pytest.mark.django_db
def test_create_project_scrum_with_default_sprint_weeks(superuser_client, organization):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        {
            **PROJECT_PAYLOAD,
            "key": "SCR3",
            "slug": "scrum-three-week",
            "name": "Scrum Three Week",
            "methodology": "scrum",
            "default_sprint_weeks": 3,
        },
        format="json",
    )

    assert response.status_code == 201
    project = response.json()["data"]["project"]
    assert project["methodology"] == "scrum"
    assert project["board_type"] == "scrum"
    assert project["default_sprint_weeks"] == 3


@pytest.mark.django_db
def test_create_project_without_methodology_defaults_to_scrum(superuser_client, organization):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/projects",
        {
            **PROJECT_PAYLOAD,
            "key": "DEFS",
            "slug": "default-scrum",
            "name": "Default Scrum",
        },
        format="json",
    )

    assert response.status_code == 201
    project = response.json()["data"]["project"]
    assert project["methodology"] == "scrum"
    assert project["board_type"] == "scrum"
    assert project["default_sprint_weeks"] == 2
