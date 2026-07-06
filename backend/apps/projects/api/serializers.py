import re

from rest_framework import serializers

from apps.projects.models import (
    BoardType,
    ProjectMethodology,
    ProjectRole,
    ProjectVisibility,
)

PROJECT_KEY_PATTERN = re.compile(r"^[A-Z0-9]{2,10}$")
PROJECT_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
RESERVED_PROJECT_KEYS = frozenset({"API", "AUTH", "ADMIN", "NULL", "TEST", "WWW"})


class ProjectCreateSerializer(serializers.Serializer):
    organization_id = serializers.UUIDField(required=False)
    name = serializers.CharField(max_length=255)
    key = serializers.CharField(max_length=10)
    slug = serializers.SlugField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    visibility = serializers.ChoiceField(
        choices=ProjectVisibility.choices,
        required=False,
        default=ProjectVisibility.ORGANIZATION,
    )
    methodology = serializers.ChoiceField(
        choices=ProjectMethodology.choices,
        required=False,
        default=ProjectMethodology.SCRUM,
    )
    default_sprint_weeks = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
        max_value=4,
    )

    def validate(self, attrs):
        methodology = attrs.get("methodology", ProjectMethodology.SCRUM)
        default_sprint_weeks = attrs.get("default_sprint_weeks")

        if methodology == ProjectMethodology.KANBAN:
            attrs["default_sprint_weeks"] = None
        elif default_sprint_weeks is None:
            attrs["default_sprint_weeks"] = 2

        return attrs

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
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )


class ProjectMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=ProjectRole.choices,
        default=ProjectRole.DEVELOPER,
        required=False,
    )


class ProjectMemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ProjectRole.choices)


class ProjectInviteSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=ProjectRole.choices,
        default=ProjectRole.DEVELOPER,
        required=False,
    )


class KanbanBoardColumnConfigSerializer(serializers.Serializer):
    status_id = serializers.UUIDField()
    wip_limit = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    is_enabled = serializers.BooleanField(required=False, default=True)
    display_order = serializers.IntegerField(required=False, min_value=0)


class KanbanBoardConfigUpdateSerializer(serializers.Serializer):
    columns = KanbanBoardColumnConfigSerializer(many=True)
