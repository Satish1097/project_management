import uuid

from django.conf import settings
from django.db import models


class UserInvitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(db_index=True)
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invitations",
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "user invitation"
        verbose_name_plural = "user invitations"

    def __str__(self):
        return f"Invitation for {self.email}"
