from django.urls import path

from apps.issues.api.views import (
    IssueAssignView,
    IssueDetailView,
    IssueMoveSprintView,
    IssueTransitionView,
    ProjectBacklogView,
    ProjectIssueListCreateView,
    ProjectKanbanView,
    SprintBoardView,
)

urlpatterns = [
    path(
        "projects/<uuid:project_id>/issues",
        ProjectIssueListCreateView.as_view(),
        name="project-issue-list-create",
    ),
    path("issues/<uuid:issue_id>", IssueDetailView.as_view(), name="issue-detail"),
    path("issues/<uuid:issue_id>/assign", IssueAssignView.as_view(), name="issue-assign"),
    path(
        "issues/<uuid:issue_id>/transition",
        IssueTransitionView.as_view(),
        name="issue-transition",
    ),
    path(
        "issues/<uuid:issue_id>/move-sprint",
        IssueMoveSprintView.as_view(),
        name="issue-move-sprint",
    ),
    path(
        "projects/<uuid:project_id>/backlog",
        ProjectBacklogView.as_view(),
        name="project-backlog",
    ),
    path(
        "projects/<uuid:project_id>/kanban",
        ProjectKanbanView.as_view(),
        name="project-kanban",
    ),
    path(
        "sprints/<uuid:sprint_id>/board",
        SprintBoardView.as_view(),
        name="sprint-board",
    ),
]
