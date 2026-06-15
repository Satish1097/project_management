pytest_plugins = ["apps.projects.tests.conftest"]

import pytest

from apps.issues.services.issue_service import create_issue
from apps.projects.tests.conftest import (  # noqa: F401
    VALID_PASSWORD,
    api_client,
    authenticate,
    celery_always_eager,
    developer_client,
    manager_client,
    organization,
    project,
    project_manager_user,
    project_with_manager,
    superuser,
    superuser_client,
    user,
)


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
