from django.urls import path

from apps.issues.api.views import (
    IssueAssignSprintView,
    IssueBulkAssignSprintView,
    IssueDetailView,
    IssueListCreateView,
    IssueTransitionView,
    ProjectKanbanCompatibilityView,
)

urlpatterns = [
    path("issues", IssueListCreateView.as_view(), name="issue-list-create"),
    path(
        "projects/<uuid:project_id>/kanban",
        ProjectKanbanCompatibilityView.as_view(),
        name="project-kanban-compatibility",
    ),
    path(
        "issues/bulk/assign-sprint",
        IssueBulkAssignSprintView.as_view(),
        name="issue-bulk-assign-sprint",
    ),
    path("issues/<uuid:issue_id>", IssueDetailView.as_view(), name="issue-detail"),
    path(
        "issues/<uuid:issue_id>/transition",
        IssueTransitionView.as_view(),
        name="issue-transition",
    ),
    path(
        "issues/<uuid:issue_id>/assign-sprint",
        IssueAssignSprintView.as_view(),
        name="issue-assign-sprint",
    ),
]
