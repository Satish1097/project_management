from rest_framework import serializers

from apps.issues.models import Issue, IssueType, Priority
from apps.label.api.serializers import LabelSerializer
from apps.workflow.api.serializers import WorkflowStatusSerializer


class IssueSerializer(serializers.ModelSerializer):
    status = WorkflowStatusSerializer(read_only=True)
    labels = LabelSerializer(many=True, read_only=True)

    class Meta:
        model = Issue
        fields = [
            "id",
            "project",
            "key",
            "title",
            "description",
            "type",
            "priority",
            "status",
            "sprint",
            "labels",
            "assignee",
            "reporter",
            "due_date",
            "estimate_hours",
            "story_points",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "key",
            "reporter",
            "created_at",
            "updated_at",
        ]


class _IssueMutationValidationMixin:
    def validate_title(self, value):
        normalized_title = value.strip()
        if not normalized_title:
            raise serializers.ValidationError("Title cannot be empty.")
        return normalized_title

    def validate_estimate_hours(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Estimate hours must be greater than or equal to 0."
            )
        return value

    def validate_story_points(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Story points must be greater than or equal to 0."
            )
        return value


class IssueCreateSerializer(_IssueMutationValidationMixin, serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    type = serializers.ChoiceField(
        choices=IssueType.choices,
        required=False,
        default=IssueType.TASK,
    )
    priority = serializers.ChoiceField(
        choices=Priority.choices,
        required=False,
        default=Priority.MEDIUM,
    )
    sprint = serializers.UUIDField(required=False, allow_null=True, default=None)
    labels = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
    )
    assignee = serializers.UUIDField(required=False, allow_null=True, default=None)
    due_date = serializers.DateField(required=False, allow_null=True, default=None)
    estimate_hours = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        allow_null=True,
        default=None,
        min_value=0,
    )
    story_points = serializers.IntegerField(
        required=False,
        allow_null=True,
        default=None,
        min_value=0,
    )


class IssueUpdateSerializer(_IssueMutationValidationMixin, serializers.Serializer):
    title = serializers.CharField(max_length=500, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    type = serializers.ChoiceField(choices=IssueType.choices, required=False)
    priority = serializers.ChoiceField(choices=Priority.choices, required=False)
    sprint = serializers.UUIDField(required=False, allow_null=True)
    labels = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
    )
    assignee = serializers.UUIDField(required=False, allow_null=True)
    due_date = serializers.DateField(required=False, allow_null=True)
    estimate_hours = serializers.DecimalField(
        max_digits=8,
        decimal_places=2,
        required=False,
        allow_null=True,
        min_value=0,
    )
    story_points = serializers.IntegerField(required=False, allow_null=True, min_value=0)


class IssueAssignSerializer(serializers.Serializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True, default=None)


class IssueTransitionSerializer(serializers.Serializer):
    target_status_id = serializers.UUIDField()


class IssueMoveSprintSerializer(serializers.Serializer):
    sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)
