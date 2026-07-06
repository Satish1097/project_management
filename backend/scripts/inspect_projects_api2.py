import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
import django
django.setup()
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User
from apps.projects.api.views import OrganizationProjectListCreateView

user = User.objects.first()
from apps.projects.models import Project
proj = Project.objects.first()
org_id = proj.organization_id if proj is not None else None
print('ORG_ID:', org_id)
factory = APIRequestFactory()
request = factory.get(f'/api/organizations/{org_id}/projects')
force_authenticate(request, user=user)
response = OrganizationProjectListCreateView.as_view()(request, org_id=org_id)
print('STATUS', response.status_code)
print(response.data)
