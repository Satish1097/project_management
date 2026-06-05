import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User, UserPreference, UserProfile
from apps.organizations.models import OrganizationMember, OrganizationRole
from apps.organizations.services import create_organization
from apps.organizations.services.membership_service import add_organization_member

VALID_PASSWORD = "StrongPassword123"


@pytest.fixture(autouse=True)
def celery_always_eager(settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True


@pytest.fixture
def api_client():
    return APIClient()


def _create_user(email: str, *, is_superuser: bool = False) -> User:
    if is_superuser:
        user = User.objects.create_superuser(email=email, password=VALID_PASSWORD)
    else:
        user = User.objects.create_user(email=email, password=VALID_PASSWORD)
    UserProfile.objects.create(
        user=user,
        first_name=email.split("@")[0].title(),
        last_name="User",
    )
    UserPreference.objects.create(user=user)
    return user


@pytest.fixture
def superuser(db):
    return _create_user("superuser@example.com", is_superuser=True)


@pytest.fixture
def user(db):
    return _create_user("member@example.com")


@pytest.fixture
def other_user(db):
    return _create_user("other@example.com")


@pytest.fixture
def org_admin(db):
    return _create_user("admin@example.com")


@pytest.fixture
def authenticate(api_client):
    def _authenticate(target_user: User) -> APIClient:
        response = api_client.post(
            "/api/auth/login",
            {"email": target_user.email, "password": VALID_PASSWORD},
            format="json",
        )
        access = response.json()["data"]["tokens"]["access"]
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        return api_client

    return _authenticate


@pytest.fixture
def superuser_client(api_client, superuser, authenticate):
    return authenticate(superuser)


@pytest.fixture
def user_client(api_client, user, authenticate):
    return authenticate(user)


@pytest.fixture
def organization(superuser):
    return create_organization(
        name="Test Organization",
        slug="test-org",
        owner_user_id=superuser.id,
        creator=superuser,
    )


@pytest.fixture
def organization_with_admin(organization, superuser, org_admin):
    add_organization_member(
        organization_id=organization.id,
        user_id=org_admin.id,
        added_by=superuser,
        role=OrganizationRole.ADMIN,
    )
    return organization


@pytest.fixture
def organization_with_member(organization, superuser, user):
    add_organization_member(
        organization_id=organization.id,
        user_id=user.id,
        added_by=superuser,
        role=OrganizationRole.MEMBER,
    )
    return organization
