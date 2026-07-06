import os
import django
from django.db.models import Count

os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

from apps.projects.models import Project
from apps.issues.models import Issue
from apps.workflow.models.status import WorkflowStatusCategory

for p in Project.objects.all():
    print('\nPROJECT', p.id, p.name)
    selector_count = Issue.objects.filter(project_id=p.id).exclude(status__category=WorkflowStatusCategory.DONE).count()
    total_issues = Issue.objects.filter(project_id=p.id).count()
    print('selector_count:', selector_count, 'total_issues:', total_issues)
    print('Issues counted as open:')
    for i in Issue.objects.filter(project_id=p.id).exclude(status__category=WorkflowStatusCategory.DONE).select_related('status'):
        print('-', i.key, '|', i.status.name, '|', i.status.category)
    print('Status counts:')
    for st in p.workflow_statuses.annotate(count=Count('issues')).order_by('order'):
        print('-', st.name, '|', st.category, '|', st.count)
