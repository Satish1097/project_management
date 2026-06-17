"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # Foundation
    path("api/", include("apps.foundation.api.urls")),
    # Accounts (Phase 1 auth)
    path("api/", include("apps.accounts.api.urls")),
    # Organizations (Phase 2)
    path("api/", include("apps.organizations.api.urls")),
    # Projects (Phase 2)
    path("api/", include("apps.projects.api.urls")),
    # Issues (Phase 3)
    path("api/", include("apps.issues.api.urls")),
    # Sprints (Phase 3)
    path("api/", include("apps.sprints.api.urls")),
    # Workflow (Phase 3)
    path("api/", include("apps.workflow.api.urls")),
    # Labels (Phase 4)
    path("api/", include("apps.label.api.urls")),
    # Notifications (Phase 11)
    path("api/", include("apps.notifications.urls")),
    # OpenAPI / Swagger / ReDoc
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
