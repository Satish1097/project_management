import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
import django
django.setup()
from uuid import uuid4
from django.utils import timezone
from apps.accounts.models import User
from apps.projects.models import Project
from apps.workflow.models import WorkflowStatus
from apps.issues.models.issue import Issue
from apps.issues.models.activity import IssueActivity, IssueActivityEventType
from apps.issues.selectors import select_dashboard_activity_feed

user = User.objects.first()
project = Project.objects.first()
status = WorkflowStatus.objects.filter(project=project).first()

key = f'TST-{uuid4().hex[:6].upper()}'
issue = Issue.objects.create(
    project=project,
    key=key,
    title='Activity feed smoke test',
    description='Created by automated test',
    status=status,
    reporter=user,
)

# Create a status change activity
IssueActivity.objects.create(issue=issue, actor=user, event_type=IssueActivityEventType.STATUS_CHANGED, old_value='To Do', new_value='In Progress')
# Create a sprint change activity
IssueActivity.objects.create(issue=issue, actor=user, event_type=IssueActivityEventType.SPRINT_CHANGED, old_value=None, new_value='Sprint 3')
# Create a comment activity
IssueActivity.objects.create(issue=issue, actor=user, event_type=IssueActivityEventType.COMMENT_ADDED, old_value=None, new_value=str(uuid4()))

activities = select_dashboard_activity_feed(user.id)
print('NEWEST 3 ACTIVITY:')
for a in activities[:5]:
    print(a)

print('\nAPI VIEW:')
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.projects.api.views import DashboardActivityView
factory = APIRequestFactory()
request = factory.get('/api/dashboard/activity')
force_authenticate(request, user=user)
response = DashboardActivityView.as_view()(request)
print(response.data['data']['activities'][:5])
