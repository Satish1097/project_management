import pytest

from apps.organizations.models import OrganizationRole
from apps.organizations.services.membership_service import add_organization_member
from apps.projects.models import ProjectRole
from apps.projects.services import create_project
from apps.projects.services.membership_service import add_project_member

from apps.organizations.tests.conftest import (  # noqa: F401
    VALID_PASSWORD,
    api_client,
    authenticate,
    celery_always_eager,
    org_admin,
    organization,
    organization_with_admin,
    organization_with_member,
    other_user,
    superuser,
    superuser_client,
    user,
    user_client,
)


@pytest.fixture
def project(organization, superuser):
    return create_project(
        organization=organization.id,
        name="HR Management System",
        key="HRMS",
        slug="hrms",
        creator=superuser,
        visibility="organization",
    )


@pytest.fixture
def kanban_project(organization, superuser):
    return create_project(
        organization=organization.id,
        name="Kanban Delivery Board",
        key="KANB",
        slug="kanban-board",
        creator=superuser,
        visibility="organization",
        methodology="kanban",
    )


@pytest.fixture
def project_with_roles(project, superuser, user, other_user):
    add_project_member(
        project_id=project.id,
        user_id=user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
        role=ProjectRole.VIEWER,
    )
    return project


@pytest.fixture
def kanban_project_with_manager(kanban_project, superuser, project_manager_user):
    add_project_member(
        project_id=kanban_project.id,
        user_id=project_manager_user.id,
        added_by=superuser,
        role=ProjectRole.PROJECT_MANAGER,
    )
    return kanban_project


@pytest.fixture
def org_member_client(api_client, organization_with_member, user, authenticate):
    return authenticate(user)


@pytest.fixture
def project_manager_user(db):
    from apps.accounts.models import User, UserPreference, UserProfile

    manager = User.objects.create_user(
        email="manager@example.com",
        password=VALID_PASSWORD,
    )
    UserProfile.objects.create(user=manager, first_name="Project", last_name="Manager")
    UserPreference.objects.create(user=manager)
    return manager


@pytest.fixture
def project_with_manager(project, superuser, project_manager_user):
    add_project_member(
        project_id=project.id,
        user_id=project_manager_user.id,
        added_by=superuser,
        role=ProjectRole.PROJECT_MANAGER,
    )
    return project


@pytest.fixture
def organization_admin_client(api_client, organization_with_admin, org_admin, authenticate):
    return authenticate(org_admin)


@pytest.fixture
def developer_client(api_client, project_with_roles, user, authenticate):
    return authenticate(user)


@pytest.fixture
def viewer_client(api_client, project_with_roles, other_user, authenticate):
    return authenticate(other_user)


@pytest.fixture
def manager_client(api_client, project_with_manager, project_manager_user, authenticate):
    return authenticate(project_manager_user)
