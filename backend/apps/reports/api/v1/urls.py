from django.urls import path
from apps.reports.api.v1.views import (
    SprintBurndownReportView,
    SprintReportView,
    VelocityReportView,
)

urlpatterns = [
    path(
        "projects/<uuid:project_id>/reports/burndown",
        SprintBurndownReportView.as_view(),
        name="project-report-burndown",
    ),
    path(
        "projects/<uuid:project_id>/reports/sprint-report",
        SprintReportView.as_view(),
        name="project-report-sprint-report",
    ),
    path(
        "projects/<uuid:project_id>/reports/velocity",
        VelocityReportView.as_view(),
        name="project-report-velocity",
    ),
]
