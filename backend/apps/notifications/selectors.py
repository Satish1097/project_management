"""
Read-only notification query helpers for apps.notifications.
"""
from uuid import UUID

from django.db.models import QuerySet

from apps.notifications.models import Notification


def _optimized_notification_queryset() -> QuerySet[Notification]:
    return Notification.objects.select_related(
        "actor",
        "related_issue",
    )


def get_notification_by_id(notification_id: UUID) -> Notification | None:
    return _optimized_notification_queryset().filter(pk=notification_id).first()


def get_user_notifications(user_id: UUID) -> QuerySet[Notification]:
    return _optimized_notification_queryset().filter(user_id=user_id).order_by("-created_at")


def get_unread_notifications(user_id: UUID) -> QuerySet[Notification]:
    return (
        _optimized_notification_queryset()
        .filter(user_id=user_id, is_read=False)
        .order_by("-created_at")
    )


def get_unread_notification_count(user_id: UUID) -> int:
    return Notification.objects.filter(user_id=user_id, is_read=False).count()
