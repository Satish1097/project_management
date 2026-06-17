from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel

from .issue import Issue


class IssueAttachment(BaseModel):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="issue_attachments",
    )
    file = models.FileField(upload_to="issue_attachments/")

    class Meta:
        verbose_name = "issue attachment"
        verbose_name_plural = "issue attachments"
        indexes = [
            models.Index(fields=["issue", "created_at"]),
        ]
