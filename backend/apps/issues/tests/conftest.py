pytest_plugins = ["apps.projects.tests.conftest"]

import pytest

from apps.contracts.workflow_contract import get_status_by_slug
from apps.issues.services.issue_service import create_issue
from apps.organizations.services.membership_service import add_organization_member
from apps.projects.models import ProjectRole
from apps.projects.services.membership_service import add_project_member

from apps.projects.tests.conftest import (  # noqa: F401
    VALID_PASSWORD,
    api_client,
    authenticate,
    celery_always_eager,
    developer_client,
    manager_client,
    organization,
    other_user,
    project,
    project_manager_user,
    project_with_manager,
    project_with_roles,
    superuser,
    superuser_client,
    user,
    viewer_client,
)


@pytest.fixture
def qa_user(db):
    from apps.accounts.models import User, UserPreference, UserProfile

    qa = User.objects.create_user(email="qa@example.com", password=VALID_PASSWORD)
    UserProfile.objects.create(user=qa, first_name="QA", last_name="Tester")
    UserPreference.objects.create(user=qa)
    return qa


@pytest.fixture
def project_with_qa(project, superuser, qa_user):
    add_project_member(
        project_id=project.id,
        user_id=qa_user.id,
        added_by=superuser,
        role=ProjectRole.QA,
    )
    return project


@pytest.fixture
def qa_client(api_client, project_with_qa, qa_user, superuser, organization, authenticate):
    add_organization_member(
        organization_id=organization.id,
        user_id=qa_user.id,
        added_by=superuser,
    )
    return authenticate(qa_user)


@pytest.fixture
def issue_payload():
    return {
        "title": "Implement login API",
        "description": "Auth endpoint",
        "issue_type": "task",
        "priority": "medium",
    }


@pytest.fixture
def create_test_issue(project, superuser):
    def _create(**kwargs):
        defaults = {
            "project_id": project.id,
            "title": "Test issue",
            "actor_id": superuser.id,
        }
        defaults.update(kwargs)
        return create_issue(**defaults)

    return _create


@pytest.fixture
def status_ids(project):
    """Map workflow slug → status UUID for the project."""
    slugs = ("todo", "in_progress", "in_review", "done", "blocked")
    return {slug: get_status_by_slug(project.id, slug).id for slug in slugs}
