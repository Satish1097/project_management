import pytest

from apps.accounts.models import User, UserPreference, UserProfile
from apps.organizations.services import create_organization
from apps.organizations.services.membership_service import add_organization_member
from apps.projects.models import ProjectRole
from apps.projects.services.membership_service import add_project_member
from apps.projects.services import create_project

CONTEXT_URL = "/api/me/context"
VALID_PASSWORD = "StrongPassword123"


@pytest.fixture
def superuser(db):
    user = User.objects.create_superuser(
        email="context-super@example.com",
        password=VALID_PASSWORD,
    )
    UserProfile.objects.create(user=user, first_name="Context", last_name="Super")
    UserPreference.objects.create(user=user)
    return user


@pytest.mark.django_db
def test_context_unauthenticated_returns_401(api_client):
    response = api_client.get(CONTEXT_URL)

    assert response.status_code == 401
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_context_returns_user_organizations_and_projects(authenticated_client, user, superuser):
    organization = create_organization(
        name="Context Org",
        slug="context-org",
        owner_user_id=superuser.id,
        creator=superuser,
    )
    add_organization_member(
        organization_id=organization.id,
        user_id=user.id,
        added_by=superuser,
    )
    project = create_project(
        organization=organization.id,
        name="Context Project",
        key="CTX",
        slug="context-project",
        creator=superuser,
        visibility="organization",
    )

    response = authenticated_client.get(CONTEXT_URL)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]

    assert "user" in data
    assert data["user"]["id"] == str(user.id)
    assert data["user"]["email"] == user.email

    assert "organizations" in data
    assert len(data["organizations"]) == 1
    assert data["organizations"][0]["id"] == str(organization.id)

    assert "projects" in data
    assert data["projects"] == []

    add_project_member(
        project_id=project.id,
        user_id=user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )
    second_response = authenticated_client.get(CONTEXT_URL)
    second_projects = second_response.json()["data"]["projects"]
    assert len(second_projects) == 1
    assert second_projects[0]["id"] == str(project.id)


@pytest.mark.django_db
def test_context_includes_is_superuser(authenticated_client, user):
    response = authenticated_client.get(CONTEXT_URL)

    assert response.status_code == 200
    assert response.json()["data"]["user"]["is_superuser"] is False


@pytest.mark.django_db
def test_context_superuser_flag(api_client, superuser):
    login = api_client.post(
        "/api/auth/login",
        {"email": superuser.email, "password": VALID_PASSWORD},
        format="json",
    )
    access = login.json()["data"]["tokens"]["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    response = api_client.get(CONTEXT_URL)

    assert response.status_code == 200
    assert response.json()["data"]["user"]["is_superuser"] is True


@pytest.mark.django_db
def test_context_empty_for_user_without_memberships(authenticated_client, user):
    response = authenticated_client.get(CONTEXT_URL)

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["user"]["id"] == str(user.id)
    assert data["organizations"] == []
    assert data["projects"] == []
