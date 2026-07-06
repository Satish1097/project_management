from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150, default="", blank=True)
    avatar = models.URLField(null=True, blank=True)
    timezone = models.CharField(max_length=63, null=True, blank=True)

    class Meta:
        verbose_name = "user profile"
        verbose_name_plural = "user profiles"

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or str(self.user_id)
