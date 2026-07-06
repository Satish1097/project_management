import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
import django
django.setup()
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User
from apps.projects.api.views import OrganizationProjectListCreateView

user = User.objects.first()
factory = APIRequestFactory()
request = factory.get('/api/organizations/{org_id}/projects')
force_authenticate(request, user=user)
response = OrganizationProjectListCreateView.as_view()(request, org_id=user.organization_id)
print('STATUS', response.status_code)
print(response.data)
