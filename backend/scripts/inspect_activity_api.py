import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
import django
django.setup()
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.accounts.models import User
from apps.projects.api.views import DashboardActivityView

factory = APIRequestFactory()
user = User.objects.first()
request = factory.get('/api/dashboard/activity')
force_authenticate(request, user=user)
response = DashboardActivityView.as_view()(request)
print('RESPONSE STATUS:', response.status_code)
print('RESPONSE DATA:', response.data)
