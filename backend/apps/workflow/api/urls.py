from django.urls import path

from apps.workflow.api.views import ProjectWorkflowView

urlpatterns = [
    path(
        "projects/<uuid:project_id>/workflow",
        ProjectWorkflowView.as_view(),
        name="project-workflow",
    ),
]
