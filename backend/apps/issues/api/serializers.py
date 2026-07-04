from rest_framework import serializers

from apps.issues.models import (
    Issue,
    IssueActivity,
    IssueAttachment,
    IssueComment,
    IssueType,
    Priority,
)
from apps.label.api.serializers import LabelSerializer
from apps.workflow.api.serializers import WorkflowStatusSerializer
from apps.workflow.slug_utils import status_slug


def _issue_is_done(issue: Issue) -> bool:
    slug = status_slug(name=issue.status.name, category=issue.status.category)
    return slug == "done"


class IssueSerializer(serializers.ModelSerializer):
    status = WorkflowStatusSerializer(read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    assignee = serializers.SerializerMethodField()

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
            "parent_issue",
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

    def get_assignee(self, obj: Issue):
        assignee_id = obj.get_primary_assignee_id()
        return str(assignee_id) if assignee_id else None


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
    parent_issue = serializers.UUIDField(
        required=False,
        allow_null=True,
        default=None,
    )


class SubtaskSerializer(serializers.ModelSerializer):
    done = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            "id",
            "key",
            "title",
            "done",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_done(self, obj: Issue) -> bool:
        return _issue_is_done(obj)


class SubtaskCreateSerializer(_IssueMutationValidationMixin, serializers.Serializer):
    title = serializers.CharField(max_length=500)


class SubtaskUpdateSerializer(_IssueMutationValidationMixin, serializers.Serializer):
    title = serializers.CharField(max_length=500, required=False)
    done = serializers.BooleanField(required=False)


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
    to_status_id = serializers.UUIDField(required=False)
    target_status_id = serializers.UUIDField(required=False)

    def validate(self, attrs):
        to_status_id = attrs.get("to_status_id") or attrs.get("target_status_id")
        if to_status_id is None:
            raise serializers.ValidationError(
                {"to_status_id": "This field is required."}
            )
        attrs["to_status_id"] = to_status_id
        return attrs


class IssueMoveSprintSerializer(serializers.Serializer):
    sprint_id = serializers.UUIDField(required=False, allow_null=True, default=None)


class _CommentMutationValidationMixin:
    def validate_body(self, value):
        normalized_body = value.strip()
        if not normalized_body:
            raise serializers.ValidationError("Comment body cannot be empty.")
        return normalized_body


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueComment
        fields = [
            "id",
            "issue",
            "author",
            "body",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]


class IssueActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueActivity
        fields = [
            "id",
            "actor",
            "event_type",
            "old_value",
            "new_value",
            "created_at",
        ]
        read_only_fields = fields


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IssueAttachment
        fields = [
            "id",
            "issue",
            "uploaded_by",
            "file",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "uploaded_by",
            "created_at",
        ]


class CommentCreateSerializer(_CommentMutationValidationMixin, serializers.Serializer):
    body = serializers.CharField()


class CommentUpdateSerializer(_CommentMutationValidationMixin, serializers.Serializer):
    body = serializers.CharField()
