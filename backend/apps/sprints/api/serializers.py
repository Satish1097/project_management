from rest_framework import serializers


class SprintCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    goal = serializers.CharField(required=False, allow_blank=True, default="")
    start_date = serializers.DateField(required=False, allow_null=True, default=None)
    end_date = serializers.DateField(required=False, allow_null=True, default=None)


class SprintUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    goal = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)


class SprintCompleteSerializer(serializers.Serializer):
    move_incomplete_to = serializers.ChoiceField(
        choices=["backlog", "sprint"],
        required=False,
        default="backlog",
    )
    target_sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)


class SprintBulkMoveSerializer(serializers.Serializer):
    issue_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )
    sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)
