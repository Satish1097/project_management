from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel


class Organization(BaseModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_organizations",
    )
    branding = models.JSONField(default=dict, blank=True)
    settings = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "organization"
        verbose_name_plural = "organizations"

    def __str__(self):
        return self.name
