from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel

from .organization import Organization


class OrganizationRole(models.TextChoices):
    OWNER = "owner", "Owner"
    ADMIN = "admin", "Admin"
    MEMBER = "member", "Member"


class OrganizationMember(BaseModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organization_memberships",
    )
    role = models.CharField(
        max_length=20,
        choices=OrganizationRole.choices,
    )
    is_active = models.BooleanField(default=True)
    can_create_projects = models.BooleanField(default=False)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organization_members_added",
    )

    class Meta:
        verbose_name = "organization member"
        verbose_name_plural = "organization members"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "user"],
                name="organizations_orgmember_org_user_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "role"]),
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.organization_id} ({self.role})"
