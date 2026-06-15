import uuid

import pytest

from apps.projects.exceptions import (
    ProjectKeyConflictError,
    ProjectMembershipError,
    ProjectSlugConflictError,
)
from apps.projects.models import ProjectMember, ProjectRole
from apps.projects.selectors import (
    select_project_by_id,
    select_project_member,
    select_project_role,
    select_projects_for_organization,
)
from apps.projects.services import create_project, update_project
from apps.projects.services.membership_service import add_project_member, remove_project_member


@pytest.mark.django_db
def test_create_project_service_adds_creator_as_admin(superuser, organization):
    project = create_project(
        organization=organization.id,
        name="Service Project",
        key="SVC",
        slug="service-project",
        creator=superuser,
    )

    membership = ProjectMember.objects.get(project_id=project.id, user_id=superuser.id)
    assert membership.role == ProjectRole.PROJECT_ADMIN


@pytest.mark.django_db
def test_create_project_duplicate_key_raises(superuser, organization, project):
    with pytest.raises(ProjectKeyConflictError):
        create_project(
            organization=organization.id,
            name="Duplicate Key",
            key=project.key,
            slug="unique-slug",
            creator=superuser,
        )


@pytest.mark.django_db
def test_create_project_duplicate_slug_raises(superuser, organization, project):
    with pytest.raises(ProjectSlugConflictError):
        create_project(
            organization=organization.id,
            name="Duplicate Slug",
            key="UNIQ",
            slug=project.slug,
            creator=superuser,
        )


@pytest.mark.django_db
def test_update_project_lead_must_be_member(superuser, project, other_user):
    with pytest.raises(ProjectMembershipError):
        update_project(
            project_id=project.id,
            actor=superuser,
            lead_user_id=other_user.id,
        )


@pytest.mark.django_db
def test_add_project_member_duplicate_raises(superuser, project, other_user):
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
    )

    with pytest.raises(ProjectMembershipError):
        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
        )


@pytest.mark.django_db
def test_remove_project_member_deletes_row(superuser, project, other_user):
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
    )

    remove_project_member(project_id=project.id, user_id=other_user.id)

    assert select_project_member(project.id, other_user.id) is None


@pytest.mark.django_db
def test_select_project_by_id(superuser, project):
    result = select_project_by_id(project.id)

    assert result is not None
    assert result.id == project.id
    assert result.key == project.key


@pytest.mark.django_db
def test_select_projects_for_organization(superuser, organization, project):
    results = select_projects_for_organization(organization.id, superuser.id)

    assert len(results) == 1
    assert results[0].id == project.id


@pytest.mark.django_db
def test_select_project_member_lookup(superuser, project, other_user):
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
        role=ProjectRole.QA,
    )

    member = select_project_member(project.id, other_user.id)

    assert member is not None
    assert member.role == ProjectRole.QA


@pytest.mark.django_db
def test_select_project_role_lookup(superuser, project, other_user):
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
        role=ProjectRole.VIEWER,
    )

    role = select_project_role(project.id, other_user.id)

    assert role == ProjectRole.VIEWER


@pytest.mark.django_db
def test_select_project_by_id_not_found():
    assert select_project_by_id(uuid.uuid4()) is None
