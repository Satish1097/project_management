from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel

from .issue import Issue


class IssueComment(BaseModel):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="issue_comments",
    )
    body = models.TextField()

    class Meta:
        verbose_name = "issue comment"
        verbose_name_plural = "issue comments"
        indexes = [
            models.Index(fields=["issue", "created_at"]),
        ]
