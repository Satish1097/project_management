import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE','core.settings')
import django
django.setup()
from apps.accounts.models import User
from apps.issues.selectors import select_dashboard_activity_feed
user = User.objects.first()
print('USER:', user.id, user.email)
activity = select_dashboard_activity_feed(user.id)
print('ACTIVITY COUNT:', len(activity))
for a in activity[:50]:
    print(a)
