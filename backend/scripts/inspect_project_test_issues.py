import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
import sys

# Ensure backend package is importable
sys.path.insert(0, '.')

django.setup()

from apps.projects.models import Project
from apps.issues.models import Issue
from apps.workflow.models.status import WorkflowStatusCategory
from apps.projects.selectors import select_project_summary

p = Project.objects.filter(name__iexact='Project Test').first()
if not p:
    print('Project not found')
    sys.exit(1)

print('PROJECT', p.id, p.name)
issues = Issue.objects.filter(project_id=p.id).select_related('status', 'sprint')
print('TOTAL ISSUES', issues.count())
open_qs = issues.exclude(status__category=WorkflowStatusCategory.DONE)
print('SELECTOR COUNT (exclude DONE):', open_qs.count())
print('\nALL ISSUES:')
for i in issues.order_by('key'):
    print(i.key, '| status=', i.status.name, '| category=', i.status.category, '| is_deleted=', i.is_deleted, '| sprint=', getattr(i.sprint, 'name', None), '| sprint_status=', getattr(i.sprint, 'status', None))

print('\nISSUES COUNTED AS OPEN:')
for i in open_qs.order_by('key'):
    print(i.key, '| status=', i.status.name, '| category=', i.status.category, '| is_deleted=', i.is_deleted, '| sprint=', getattr(i.sprint, 'name', None), '| sprint_status=', getattr(i.sprint, 'status', None))

dto = select_project_summary(p.id)
print('\nSELECT_PROJECT_SUMMARY.open_issue_count (selector):', dto.open_issue_count if dto else None)
