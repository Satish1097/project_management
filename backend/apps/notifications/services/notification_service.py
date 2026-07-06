from uuid import UUID

from apps.notifications.models import Notification
from apps.notifications.selectors import get_notification_by_id


class NotificationService:
    def create_notification(
        self,
        *,
        user_id: UUID,
        actor_id: UUID | None = None,
        event_type: str,
        title: str,
        message: str,
        related_issue_id: UUID | None = None,
    ) -> Notification:
        return Notification.objects.create(
            user_id=user_id,
            actor_id=actor_id,
            event_type=event_type,
            title=title,
            message=message,
            related_issue_id=related_issue_id,
        )

    def mark_read(self, user_id: UUID, notification_id: UUID) -> Notification:
        notification = get_notification_by_id(notification_id)
        if notification is None:
            raise Notification.DoesNotExist(f"Notification '{notification_id}' not found.")
        if notification.user_id != user_id:
            raise PermissionError("Permission denied: cannot modify this notification.")

        if not notification.is_read:
            notification.is_read = True
            notification.save(update_fields=["is_read", "updated_at"])

        return notification

    def mark_all_read(self, user_id: UUID) -> int:
        return Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)

    def delete_notification(self, user_id: UUID, notification_id: UUID) -> bool:
        notification = get_notification_by_id(notification_id)
        if notification is None or notification.user_id != user_id:
            raise Notification.DoesNotExist(f"Notification '{notification_id}' not found.")

        notification.delete()
        return True


notification_service = NotificationService()
