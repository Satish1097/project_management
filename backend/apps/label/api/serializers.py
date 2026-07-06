from rest_framework import serializers

from apps.label.models import Label


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = [
            "id",
            "name",
            "color",
            "is_archived",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class LabelCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50)
    color = serializers.RegexField(regex=r"^#[0-9A-Fa-f]{6}$")

    def validate_name(self, value):
        normalized_name = value.strip()
        if not normalized_name:
            raise serializers.ValidationError("Name cannot be empty.")
        return normalized_name


class LabelUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=50, required=False)
    color = serializers.RegexField(regex=r"^#[0-9A-Fa-f]{6}$", required=False)

    def validate_name(self, value):
        normalized_name = value.strip()
        if not normalized_name:
            raise serializers.ValidationError("Name cannot be empty.")
        return normalized_name
