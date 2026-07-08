import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.db import connection
from django.test.utils import CaptureQueriesContext
from apps.projects.models import Project
from apps.sprints.models import Sprint, SprintSnapshot
from apps.issues.models import Issue, StoryPointHistory
from apps.workflow.models import WorkflowStatus, WorkflowStatusCategory, IssueStatusHistory
from apps.reports.services.report_service import ReportService
from django.utils import timezone
from datetime import timedelta
import logging

def run_validations():
    # Setup test data
    from apps.organizations.models import Organization
    org = Organization.objects.create(name="Test Org", slug="test-org")
    project = Project.objects.create(organization=org, name="Test Burndown Project", key="TBP", slug="tbp", methodology="scrum")
    
    status_todo = WorkflowStatus.objects.create(project=project, name="To Do", category=WorkflowStatusCategory.TODO)
    status_in_progress = WorkflowStatus.objects.create(project=project, name="In Progress", category=WorkflowStatusCategory.IN_PROGRESS)
    status_done = WorkflowStatus.objects.create(project=project, name="Done", category=WorkflowStatusCategory.DONE)
    
    sprint = Sprint.objects.create(
        project=project,
        name="Validation Sprint",
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timedelta(days=14),
        status="active"
    )
    
    issue1 = Issue.objects.create(project=project, title="Issue 1", status=status_todo, story_points=5, sprint=sprint)
    issue2 = Issue.objects.create(project=project, title="Issue 2", status=status_todo, story_points=3, sprint=sprint)
    
    from apps.reports.services.analytics_recorder import analytics_event_recorder
    analytics_event_recorder.record_sprint_snapshot(sprint, snapshot_type="start")
    
    # Validation 1: Why committed_points is 0 while committed_issues > 0
    # Actually, we will just print what the report returns.
    report_service = ReportService(project.id)
    
    # We will test the query count
    with CaptureQueriesContext(connection) as queries:
        report = report_service.get_sprint_burndown(str(sprint.id))
    
    print("--- VALIDATION RESULTS ---")
    print(f"1 & 2: Report Data: {report}")
    print(f"3: Query Count: {len(queries.captured_queries)}")
    
    # 4 & 5: Cache invalidation and lifecycle events
    # Let's change story points mid-sprint
    print("\n--- Mid-sprint changes ---")
    issue1.story_points = 8
    issue1.save()
    analytics_event_recorder.record_story_point_change(issue1, 5, 8, None)
    
    report2 = report_service.get_sprint_burndown(str(sprint.id))
    print(f"Report after SP change: {report2}")
    
    # Complete an issue
    analytics_event_recorder.record_status_transition(issue1, status_todo, status_done, None)
    issue1.status = status_done
    issue1.save()
    
    report3 = report_service.get_sprint_burndown(str(sprint.id))
    print(f"Report after Issue completion: {report3}")
    
    # Reopen issue
    analytics_event_recorder.record_status_transition(issue1, status_done, status_todo, None)
    issue1.status = status_todo
    issue1.save()
    
    report4 = report_service.get_sprint_burndown(str(sprint.id))
    print(f"Report after Issue reopen: {report4}")

if __name__ == "__main__":
    run_validations()
