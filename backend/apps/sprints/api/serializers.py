from rest_framework import serializers

from apps.sprints.models import Sprint


class SprintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sprint
        fields = [
            "id",
            "project",
            "name",
            "goal",
            "start_date",
            "end_date",
            "status",
            "capacity_points",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
        ]


class _SprintMutationValidationMixin:
    def validate_name(self, value):
        normalized_value = value.strip()
        if not normalized_value:
            raise serializers.ValidationError("Name cannot be empty.")
        return normalized_value

    def validate_capacity_points(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Capacity points must be greater than or equal to 0.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)

        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                {"end_date": "End date must be on or after start date."}
            )

        return attrs


class SprintCreateSerializer(_SprintMutationValidationMixin, serializers.Serializer):
    name = serializers.CharField(max_length=100)
    goal = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    capacity_points = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class SprintUpdateSerializer(_SprintMutationValidationMixin, serializers.Serializer):
    name = serializers.CharField(max_length=100, required=False)
    goal = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    capacity_points = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class SprintCompleteSerializer(serializers.Serializer):
    move_incomplete_to = serializers.ChoiceField(
        choices=["backlog", "sprint"],
        default="backlog",
        required=False,
    )
    target_sprint_id = serializers.UUIDField(required=False, allow_null=True)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        destination = attrs.get("move_incomplete_to", "backlog")
        target_sprint_id = attrs.get("target_sprint_id")

        if destination == "sprint" and target_sprint_id is None:
            raise serializers.ValidationError(
                {"target_sprint_id": "Target sprint is required when moving to another sprint."}
            )
        if destination == "backlog":
            attrs["target_sprint_id"] = None

        return attrs
