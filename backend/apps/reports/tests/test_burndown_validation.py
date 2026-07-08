import pytest
from django.utils import timezone
from datetime import timedelta
from apps.projects.models import Project
from apps.sprints.models import Sprint
from apps.issues.models import Issue
from apps.workflow.models import WorkflowStatus, WorkflowStatusCategory
from apps.reports.services.report_service import ReportService
from apps.reports.services.analytics_recorder import analytics_event_recorder
from django.test.utils import CaptureQueriesContext
from django.db import connection

@pytest.mark.django_db
def test_production_readiness_validation(user, organization):
    # Setup
    owner = user
    from apps.organizations.models import Organization
    org = Organization.objects.get(id=organization.id)
    project = Project.objects.create(organization=org, name="Burndown Proj", key="BP", slug="bp", methodology="scrum")
    
    status_todo = WorkflowStatus.objects.create(project=project, name="To Do", category=WorkflowStatusCategory.TODO, order=1)
    status_in_progress = WorkflowStatus.objects.create(project=project, name="In Progress", category=WorkflowStatusCategory.IN_PROGRESS, order=2)
    status_done = WorkflowStatus.objects.create(project=project, name="Done", category=WorkflowStatusCategory.DONE, order=3)
    
    sprint = Sprint.objects.create(
        project=project,
        name="Sprint 1",
        start_date=timezone.now().date(),
        end_date=timezone.now().date() + timedelta(days=14),
        status="active"
    )
    
    issue1 = Issue.objects.create(project=project, key="BP-1", title="Issue 1", status=status_todo, story_points=5, sprint=sprint, reporter=owner)
    issue2 = Issue.objects.create(project=project, key="BP-2", title="Issue 2", status=status_todo, story_points=3, sprint=sprint, reporter=owner)
    
    analytics_event_recorder.record_sprint_snapshot(sprint, snapshot_type="start")
    
    report_service = ReportService()
    
    # 1. Why committed_points is 0 while committed_issues > 0
    # Let's inspect the report
    with CaptureQueriesContext(connection) as queries:
        report = report_service.get_sprint_burndown(project.id, sprint.id)
    
    print("\n\n--- VALIDATION RESULTS ---")
    print(f"INITIAL REPORT: {report}")
    print(f"QUERY COUNT: {len(queries.captured_queries)}")
    
    assert report['committed_points'] == 8
    assert report['committed_issues'] == 2
    
    # Mid sprint add/remove
    issue3 = Issue.objects.create(project=project, key="BP-3", title="Issue 3", status=status_todo, story_points=2, sprint=sprint, reporter=owner)
    
    report_after_add = report_service.get_sprint_burndown(project.id, sprint.id)
    print(f"REPORT AFTER ADD (Mid-sprint): {report_after_add}")
    
    # Story point change
    issue1.story_points = 8
    issue1.save()
    analytics_event_recorder.record_story_point_change(issue1, 5, 8, owner)
    
    report_after_sp_change = report_service.get_sprint_burndown(project.id, sprint.id)
    print(f"REPORT AFTER SP CHANGE: {report_after_sp_change}")
    
    # Complete an issue
    analytics_event_recorder.record_status_transition(issue1, status_todo, status_done, owner)
    issue1.status = status_done
    issue1.save()
    
    report_after_complete = report_service.get_sprint_burndown(project.id, sprint.id)
    print(f"REPORT AFTER ISSUE COMPLETE: {report_after_complete}")
    
    # Reopen issue
    analytics_event_recorder.record_status_transition(issue1, status_done, status_todo, owner)
    issue1.status = status_todo
    issue1.save()
    
    report_after_reopen = report_service.get_sprint_burndown(project.id, sprint.id)
    print(f"REPORT AFTER ISSUE REOPEN: {report_after_reopen}")
    print("--------------------------\n\n")

