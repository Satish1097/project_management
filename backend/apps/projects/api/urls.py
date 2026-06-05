from django.urls import path

from apps.projects.api.views import (
    OrganizationProjectListCreateView,
    ProjectArchiveView,
    ProjectDetailView,
    ProjectMemberDetailView,
    ProjectMemberListCreateView,
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
        "projects/<uuid:project_id>/members/<uuid:user_id>",
        ProjectMemberDetailView.as_view(),
        name="project-member-detail",
    ),
]
