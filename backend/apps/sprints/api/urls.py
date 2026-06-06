from django.urls import path

from apps.sprints.api.views import (
    ProjectSprintListCreateView,
    SprintCompleteView,
    SprintDetailView,
    SprintMoveIssuesView,
    SprintStartView,
)

urlpatterns = [
    path(
        "projects/<uuid:project_id>/sprints",
        ProjectSprintListCreateView.as_view(),
        name="project-sprint-list-create",
    ),
    path("sprints/<uuid:sprint_id>", SprintDetailView.as_view(), name="sprint-detail"),
    path("sprints/<uuid:sprint_id>/start", SprintStartView.as_view(), name="sprint-start"),
    path(
        "sprints/<uuid:sprint_id>/complete",
        SprintCompleteView.as_view(),
        name="sprint-complete",
    ),
    path(
        "sprints/<uuid:sprint_id>/move-issues",
        SprintMoveIssuesView.as_view(),
        name="sprint-move-issues",
    ),
]
