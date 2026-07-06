from rest_framework import serializers

from apps.workflow.models.status import WorkflowStatus, WorkflowStatusCategory
from apps.workflow.models.transition import WorkflowTransition


class WorkflowStatusSerializer(serializers.ModelSerializer):
    order = serializers.IntegerField(min_value=0)
    category = serializers.ChoiceField(
        choices=[
            WorkflowStatusCategory.TODO,
            WorkflowStatusCategory.IN_PROGRESS,
            WorkflowStatusCategory.DONE,
        ]
    )

    class Meta:
        model = WorkflowStatus
        fields = ["id", "name", "category", "color", "order", "is_default"]
        read_only_fields = ["id"]


class WorkflowTransitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkflowTransition
        fields = ["id", "from_status", "to_status", "name"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        if attrs["from_status"] == attrs["to_status"]:
            raise serializers.ValidationError(
                {"to_status": "to_status must be different from from_status."}
            )
        return attrs


class WorkflowSerializer(serializers.Serializer):
    scheme_name = serializers.CharField(max_length=255)
    statuses = WorkflowStatusSerializer(many=True)
    transitions = WorkflowTransitionSerializer(many=True)

    def create(self, validated_data):
        raise NotImplementedError("WorkflowSerializer is validation-only.")

    def update(self, instance, validated_data):
        raise NotImplementedError("WorkflowSerializer is validation-only.")
