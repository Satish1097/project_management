from django.urls import path

from apps.label.api.views import ProjectLabelDetailView, ProjectLabelListCreateView

urlpatterns = [
    path(
        "projects/<uuid:project_id>/labels",
        ProjectLabelListCreateView.as_view(),
        name="project-label-list-create",
    ),
    path(
        "projects/<uuid:project_id>/labels/<uuid:label_id>",
        ProjectLabelDetailView.as_view(),
        name="project-label-detail",
    ),
]
