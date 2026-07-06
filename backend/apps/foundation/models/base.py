"""
Reusable abstract base model for all domain entities.

Backward compatible: existing models are unaffected until they explicitly
inherit from BaseModel. All fields are optional-friendly for gradual adoption.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def deleted(self):
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        return self.all_with_deleted().filter(is_deleted=True)


class BaseModel(models.Model):
    """
    Abstract base with UUID PK, audit fields, and soft-delete support.

    Usage (opt-in for new models):
        class Project(BaseModel):
            name = models.CharField(max_length=255)
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(app_label)s_%(class)s_updated",
    )
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self, user=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        if user is not None:
            self.updated_by = user
        self.save(update_fields=["is_deleted", "deleted_at", "updated_by", "updated_at"])

    def restore(self, user=None):
        self.is_deleted = False
        self.deleted_at = None
        if user is not None:
            self.updated_by = user
        self.save(update_fields=["is_deleted", "deleted_at", "updated_by", "updated_at"])
