from django.conf import settings
from django.db import models


class UserPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preference",
    )
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "user preference"
        verbose_name_plural = "user preferences"

    def __str__(self):
        return f"Preferences for {self.user_id}"
