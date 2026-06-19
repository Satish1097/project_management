from django.urls import path

from apps.issues.api.views import ProjectSprintKanbanView
from apps.sprints.api.views import (
    ProjectSprintListCreateView,
    ProjectSprintDetailView,
    SprintActivityView,
    SprintCompleteView,
    SprintPauseView,
    SprintResumeView,
    SprintStartView,
)

urlpatterns = [
    path(
        "projects/<uuid:project_id>/sprints",
        ProjectSprintListCreateView.as_view(),
        name="project-sprint-list-create",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>",
        ProjectSprintDetailView.as_view(),
        name="project-sprint-detail",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>/start",
        SprintStartView.as_view(),
        name="project-sprint-start",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>/pause",
        SprintPauseView.as_view(),
        name="project-sprint-pause",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>/resume",
        SprintResumeView.as_view(),
        name="project-sprint-resume",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>/complete",
        SprintCompleteView.as_view(),
        name="project-sprint-complete",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>/activity",
        SprintActivityView.as_view(),
        name="project-sprint-activity",
    ),
    path(
        "projects/<uuid:project_id>/sprints/<uuid:sprint_id>/board",
        ProjectSprintKanbanView.as_view(),
        name="project-sprint-board",
    ),
]
