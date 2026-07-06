from django.contrib import admin

from apps.accounts.models import User, UserInvitation, UserPreference, UserProfile

admin.site.register(User)
admin.site.register(UserProfile)
admin.site.register(UserPreference)
admin.site.register(UserInvitation)
