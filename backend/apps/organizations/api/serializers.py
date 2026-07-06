import re

from rest_framework import serializers

from apps.organizations.models import OrganizationRole

ORG_SLUG_PATTERN = re.compile(r"^[a-z0-9-]{3,63}$")


class OrganizationCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=63)
    owner_user_id = serializers.UUIDField()
    branding = serializers.DictField(required=False, default=dict)
    settings = serializers.DictField(required=False, default=dict)

    def validate_slug(self, value):
        normalized = value.strip().lower()
        if not ORG_SLUG_PATTERN.match(normalized):
            raise serializers.ValidationError(
                "Slug must be 3–63 lowercase alphanumeric characters or hyphens."
            )
        return normalized


class OrganizationUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    branding = serializers.DictField(required=False)
    settings = serializers.DictField(required=False)
    is_active = serializers.BooleanField(required=False)


class OrganizationMemberSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    role = serializers.ChoiceField(
        choices=OrganizationRole.choices,
        default=OrganizationRole.MEMBER,
        required=False,
    )


class OrganizationMemberUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=OrganizationRole.choices)
