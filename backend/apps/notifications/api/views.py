from uuid import UUID

from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from apps.foundation.responses import success_response
from apps.notifications.api.serializers import NotificationSerializer
from apps.notifications.models import Notification
from apps.notifications.selectors import (
    get_unread_notification_count,
    get_user_notifications,
)
from apps.notifications.services import notification_service
from apps.permissions.drf_permissions import Authenticated


class NotificationListView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=NotificationSerializer(many=True), tags=["notifications"])
    def get(self, request):
        notifications = get_user_notifications(request.user.id)
        return success_response(
            data={
                "notifications": NotificationSerializer(notifications, many=True).data,
            }
        )


class NotificationUnreadCountView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["notifications"])
    def get(self, request):
        count = get_unread_notification_count(request.user.id)
        return success_response(data={"count": count})


class NotificationMarkReadView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(responses=NotificationSerializer, tags=["notifications"])
    def post(self, request, notification_id: UUID):
        try:
            notification = notification_service.mark_read(request.user.id, notification_id)
        except (Notification.DoesNotExist, PermissionError) as exc:
            raise NotFound("Notification not found.") from exc

        return success_response(data={"notification": NotificationSerializer(notification).data})


class NotificationMarkAllReadView(APIView):
    permission_classes = [Authenticated]

    @extend_schema(tags=["notifications"])
    def post(self, request):
        updated = notification_service.mark_all_read(request.user.id)
        return success_response(data={"updated": updated})
