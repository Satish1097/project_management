"""Test sprint API returns issue counts after refresh."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from uuid import uuid4
from apps.sprints.models import Sprint, SprintStatus
from apps.projects.models import Project
from apps.organizations.models import Organization
from apps.accounts.models import User
from apps.issues.models import Issue
from apps.workflow.models import Workflow, WorkflowStatus, WorkflowStatusCategory
from django.contrib.auth.models import Group

# Create test data
print("Creating test data...")

# Create organization
org = Organization.objects.create(
    id=uuid4(),
    name="Test Org",
    slug="test-org"
)

# Create project
project = Project.objects.create(
    id=uuid4(),
    organization=org,
    key="TEST",
    slug="test",
    name="Test Project"
)

# Create workflow with statuses
workflow = Workflow.objects.create(
    id=uuid4(),
    project=project,
    name="Default"
)

todo_status = WorkflowStatus.objects.create(
    id=uuid4(),
    workflow=workflow,
    name="To Do",
    slug="todo",
    category=WorkflowStatusCategory.TODO,
    order=0
)

done_status = WorkflowStatus.objects.create(
    id=uuid4(),
    workflow=workflow,
    name="Done",
    slug="done",
    category=WorkflowStatusCategory.DONE,
    order=2
)

# Create sprint
sprint = Sprint.objects.create(
    id=uuid4(),
    project=project,
    name="Sprint 3",
    status=SprintStatus.ACTIVE,
)

# Create user
user = User.objects.create_user(
    email="test@example.com",
    password="password123"
)

# Create issues
issue1 = Issue.objects.create(
    id=uuid4(),
    key="TEST-1",
    project=project,
    title="Issue 1",
    sprint=sprint,
    status=todo_status,
    created_by=user,
)

issue2 = Issue.objects.create(
    id=uuid4(),
    key="TEST-2",
    project=project,
    title="Issue 2",
    sprint=sprint,
    status=done_status,  # Completed
    created_by=user,
)

issue3 = Issue.objects.create(
    id=uuid4(),
    key="TEST-3",
    project=project,
    title="Issue 3",
    sprint=sprint,
    status=todo_status,
    created_by=user,
)

issue4 = Issue.objects.create(
    id=uuid4(),
    key="TEST-4",
    project=project,
    title="Issue 4",
    sprint=sprint,
    status=done_status,  # Completed
    created_by=user,
)

print(f"Created sprint {sprint.id} with 4 issues (2 completed)")

# Test the selector
from apps.sprints.selectors import get_project_sprints_with_health

sprints = get_project_sprints_with_health(project.id)
print(f"\nSprints with health: {list(sprints)}")

for s in sprints:
    print(f"\nSprint: {s.name}")
    print(f"  Issue count: {s.issue_count}")
    print(f"  Completed count: {s.completed_issue_count}")
    print(f"  Progress: {s.completed_issue_count}/{s.issue_count} = {(s.completed_issue_count/s.issue_count*100) if s.issue_count > 0 else 0:.0f}%")
    
    # Verify expected values
    assert s.issue_count == 4, f"Expected 4 issues, got {s.issue_count}"
    assert s.completed_issue_count == 2, f"Expected 2 completed, got {s.completed_issue_count}"
    
print("\n✅ Sprint health data is correct!")

# Test API serialization
from apps.sprints.api.views import _sprint_to_data

print("\nTesting API serialization...")
sprint_data = _sprint_to_data(sprints.first(), include_health=True)
print(f"\nAPI Response for sprint:")
import json
print(json.dumps({
    "id": sprint_data["id"],
    "name": sprint_data["name"],
    "status": sprint_data["status"],
    "issue_count": sprint_data.get("issue_count"),
    "completed_issue_count": sprint_data.get("completed_issue_count"),
}, indent=2))

assert sprint_data.get("issue_count") == 4, f"Expected 4 in API, got {sprint_data.get('issue_count')}"
assert sprint_data.get("completed_issue_count") == 2, f"Expected 2 in API, got {sprint_data.get('completed_issue_count')}"

print("\n✅ API serialization is correct!")
print("✅ All tests passed!")
