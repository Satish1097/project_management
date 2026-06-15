from rest_framework import serializers

from apps.issues.models import IssueType, Priority


class IssueCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500)
    description = serializers.CharField(required=False, allow_blank=True, default="")
    issue_type = serializers.ChoiceField(
        choices=IssueType.choices,
        required=False,
        default=IssueType.TASK,
    )
    priority = serializers.ChoiceField(
        choices=Priority.choices,
        required=False,
        default=Priority.MEDIUM,
    )
    assignee_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    parent_issue_id = serializers.UUIDField(required=False, allow_null=True, default=None)
    story_points = serializers.IntegerField(
        required=False,
        allow_null=True,
        default=None,
        min_value=1,
    )
    due_date = serializers.DateField(required=False, allow_null=True, default=None)
    labels = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        default=list,
    )


class IssueUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=500, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(choices=Priority.choices, required=False)
    story_points = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    due_date = serializers.DateField(required=False, allow_null=True)
    labels = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
    )
    parent_issue_id = serializers.UUIDField(required=False, allow_null=True)


class IssueAssignSerializer(serializers.Serializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True, default=None)


class IssueTransitionSerializer(serializers.Serializer):
    target_status_id = serializers.UUIDField()


class IssueMoveSprintSerializer(serializers.Serializer):
    sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)
