import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
import django
django.setup()

from apps.sprints.selectors import get_project_sprints_with_health
from apps.sprints.models import Sprint
from apps.sprints.api.views import _sprint_to_data
import json

sprint = Sprint.objects.filter(name__iexact='Sprint 3').first()
project_id = sprint.project_id if sprint else None

sprints = list(get_project_sprints_with_health(project_id)) if project_id else []

print("\n=== Sprint 3 API Response ===")
for s in sprints:
    if s.name == 'Sprint 3':
        api_data = _sprint_to_data(s, include_health=True)
        print(json.dumps({
            "name": api_data["name"],
            "status": api_data["status"],
            "issue_count": api_data.get("issue_count"),
            "completed_issue_count": api_data.get("completed_issue_count"),
        }, indent=2))
        break
