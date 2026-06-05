import re

from rest_framework import serializers

from apps.projects.models import ProjectRole, ProjectVisibility

PROJECT_KEY_PATTERN = re.compile(r"^[A-Z0-9]{2,10}$")
PROJECT_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
RESERVED_PROJECT_KEYS = frozenset({"API", "AUTH", "ADMIN", "NULL", "TEST", "WWW"})


class ProjectCreateSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField(required=False)
    name = serializers.CharField(max_length=255)
    key = serializers.CharField(max_length=10)
    slug = serializers.SlugField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    lead_user_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    visibility = serializers.ChoiceField(
        choices=ProjectVisibility.choices,
        required=False,
        default=ProjectVisibility.ORGANIZATION,
    )

    def validate_key(self, value):
        normalized = value.strip().upper()
        if not PROJECT_KEY_PATTERN.match(normalized):
            raise serializers.ValidationError(
                "Key must be 2–10 uppercase alphanumeric characters."
            )
        if normalized in RESERVED_PROJECT_KEYS:
            raise serializers.ValidationError(f"Key '{normalized}' is reserved.")
        return normalized

    def validate_slug(self, value):
        normalized = value.strip().lower()
        if not PROJECT_SLUG_PATTERN.match(normalized):
            raise serializers.ValidationError(
                "Slug must be lowercase kebab-case (e.g. hrms, ai-platform)."
            )
        return normalized


class ProjectUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    visibility = serializers.ChoiceField(choices=ProjectVisibility.choices, required=False)
    lead_user_id = serializers.UUIDField(required=False, allow_null=True)


class ProjectMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=ProjectRole.choices,
        default=ProjectRole.DEVELOPER,
        required=False,
    )


class ProjectMemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ProjectRole.choices)
