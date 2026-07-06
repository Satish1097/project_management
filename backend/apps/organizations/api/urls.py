from django.urls import path

from apps.organizations.api.views import (
    OrganizationDetailView,
    OrganizationListCreateView,
    OrganizationMemberDetailView,
    OrganizationMemberListCreateView,
)

urlpatterns = [
    path("organizations", OrganizationListCreateView.as_view(), name="organization-list-create"),
    path("organizations/<uuid:org_id>", OrganizationDetailView.as_view(), name="organization-detail"),
    path(
        "organizations/<uuid:org_id>/members",
        OrganizationMemberListCreateView.as_view(),
        name="organization-member-list-create",
    ),
    path(
        "organizations/<uuid:org_id>/members/<uuid:user_id>",
        OrganizationMemberDetailView.as_view(),
        name="organization-member-detail",
    ),
]
