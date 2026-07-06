from django.urls import path

from apps.notifications.api.views import (
    NotificationListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationUnreadCountView,
)

urlpatterns = [
    path("notifications", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/unread-count",
        NotificationUnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    path(
        "notifications/<uuid:notification_id>/read",
        NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
    path(
        "notifications/read-all",
        NotificationMarkAllReadView.as_view(),
        name="notification-mark-all-read",
    ),
]
