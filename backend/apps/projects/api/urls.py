from django.urls import path

from apps.projects.api.views import (
    DashboardActivityView,
    DashboardSummaryView,
    OrganizationProjectListCreateView,
    ProjectArchiveView,
    ProjectDetailView,
    ProjectInviteView,
    ProjectMemberDetailView,
    ProjectMemberListCreateView,
    ProjectReportSummaryView,
    ProjectSprintHealthReportView,
    ProjectWorkloadReportView,
)

urlpatterns = [
    path(
        "organizations/<uuid:org_id>/projects",
        OrganizationProjectListCreateView.as_view(),
        name="organization-project-list-create",
    ),
    path("projects/<uuid:project_id>", ProjectDetailView.as_view(), name="project-detail"),
    path(
        "projects/<uuid:project_id>/archive",
        ProjectArchiveView.as_view(),
        name="project-archive",
    ),
    path(
        "projects/<uuid:project_id>/members",
        ProjectMemberListCreateView.as_view(),
        name="project-member-list-create",
    ),
    path(
        "projects/<uuid:project_id>/invite",
        ProjectInviteView.as_view(),
        name="project-invite",
    ),
    path(
        "projects/<uuid:project_id>/members/<uuid:user_id>",
        ProjectMemberDetailView.as_view(),
        name="project-member-detail",
    ),
    path("dashboard/summary", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("dashboard/activity", DashboardActivityView.as_view(), name="dashboard-activity"),
    path(
        "projects/<uuid:project_id>/reports/summary",
        ProjectReportSummaryView.as_view(),
        name="project-report-summary",
    ),
    path(
        "projects/<uuid:project_id>/reports/sprint-health",
        ProjectSprintHealthReportView.as_view(),
        name="project-sprint-health-report",
    ),
    path(
        "projects/<uuid:project_id>/reports/workload",
        ProjectWorkloadReportView.as_view(),
        name="project-workload-report",
    ),
]
