import uuid

import pytest

from apps.contracts.workflow_contract import get_status_by_slug
from apps.issues.models import Issue
from apps.organizations.models import OrganizationRole
from apps.organizations.services.membership_service import add_organization_member
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
    select_project_report_summary,
    select_project_summary,
    select_projects_for_organization,
)
from apps.projects.services import create_project, update_project
from apps.projects.services.membership_service import add_project_member, remove_project_member
from apps.sprints.models import Sprint, SprintStatus


@pytest.mark.django_db
def test_create_project_service_adds_creator_as_admin(superuser, organization):
    project = create_project(
        organization=organization.id,
        name="Service Project",
        key="SVC",
        slug="service-project",
        creator=superuser,
    )

    assert project.lead_user_id == superuser.id
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
def test_select_projects_for_organization_excludes_non_project_members(
    superuser,
    organization,
    project,
    other_user,
):
    add_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
        added_by=superuser,
        role=OrganizationRole.MEMBER,
    )

    results = select_projects_for_organization(organization.id, other_user.id)

    assert results == []


@pytest.mark.django_db
def test_select_project_summary_open_issue_count(superuser, project):
    todo_status = get_status_by_slug(project.id, "todo")
    in_progress_status = get_status_by_slug(project.id, "in_progress")
    done_status = get_status_by_slug(project.id, "done")

    assert todo_status is not None
    assert in_progress_status is not None
    assert done_status is not None

    Issue.objects.create(
        project_id=project.id,
        key="HKP01-4",
        title="Todo issue 1",
        description="",
        priority="medium",
        status_id=todo_status.id,
        reporter_id=superuser.id,
    )
    Issue.objects.create(
        project_id=project.id,
        key="HKP01-6",
        title="Todo issue 2",
        description="",
        priority="medium",
        status_id=todo_status.id,
        reporter_id=superuser.id,
    )
    Issue.objects.create(
        project_id=project.id,
        key="HKP01-7",
        title="In Progress issue",
        description="",
        priority="medium",
        status_id=in_progress_status.id,
        reporter_id=superuser.id,
    )
    Issue.objects.create(
        project_id=project.id,
        key="HKP01-1",
        title="Done issue",
        description="",
        priority="medium",
        status_id=done_status.id,
        reporter_id=superuser.id,
    )

    summary = select_project_summary(project.id)

    assert summary is not None
    assert summary.open_issue_count == 3


@pytest.mark.django_db
def test_select_project_summary_open_issue_count_includes_non_active_sprint(
    superuser,
    project,
):
    todo_status = get_status_by_slug(project.id, "todo")
    done_status = get_status_by_slug(project.id, "done")
    completed_sprint = Sprint.objects.create(
        project_id=project.id,
        name="Completed Sprint",
        status=SprintStatus.COMPLETED,
    )

    Issue.objects.create(
        project_id=project.id,
        key="HRMS-1",
        title="Open in completed sprint",
        description="",
        priority="medium",
        status_id=todo_status.id,
        sprint_id=completed_sprint.id,
        reporter_id=superuser.id,
    )
    Issue.objects.create(
        project_id=project.id,
        key="HRMS-2",
        title="Done in completed sprint",
        description="",
        priority="medium",
        status_id=done_status.id,
        sprint_id=completed_sprint.id,
        reporter_id=superuser.id,
    )

    summary = select_project_summary(project.id)

    assert summary is not None
    assert summary.open_issue_count == 1


@pytest.mark.django_db
def test_select_project_summary_open_issue_count_by_status_breakdown(superuser, project):
    todo_status = get_status_by_slug(project.id, "todo")
    in_progress_status = get_status_by_slug(project.id, "in_progress")
    in_review_status = get_status_by_slug(project.id, "in_review")
    done_status = get_status_by_slug(project.id, "done")

    for index in range(3):
        Issue.objects.create(
            project_id=project.id,
            key=f"HRMS-T{index}",
            title=f"Todo issue {index}",
            description="",
            priority="medium",
            status_id=todo_status.id,
            reporter_id=superuser.id,
        )
    Issue.objects.create(
        project_id=project.id,
        key="HRMS-IP",
        title="In progress issue",
        description="",
        priority="medium",
        status_id=in_progress_status.id,
        reporter_id=superuser.id,
    )
    Issue.objects.create(
        project_id=project.id,
        key="HRMS-IR",
        title="In review issue",
        description="",
        priority="medium",
        status_id=in_review_status.id,
        reporter_id=superuser.id,
    )
    Issue.objects.create(
        project_id=project.id,
        key="HRMS-D",
        title="Done issue",
        description="",
        priority="medium",
        status_id=done_status.id,
        reporter_id=superuser.id,
    )

    summary = select_project_summary(project.id)
    report = select_project_report_summary(superuser.id, project.id)

    assert summary is not None
    assert report is not None
    assert summary.open_issue_count == 5
    assert report["total_issues"] == 6
    assert report["open_issues"] == 5
    assert report["done_issues"] == 1


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


@pytest.mark.django_db
def test_create_project_scrum_methodology_defaults(superuser, organization):
    project = create_project(
        organization=organization.id,
        name="Scrum Defaults",
        key="SCRM",
        slug="scrum-defaults",
        creator=superuser,
        methodology="scrum",
    )

    dto = select_project_by_id(project.id)
    assert dto is not None
    assert dto.methodology == "scrum"
    assert dto.board_type == "scrum"
    assert dto.default_sprint_weeks == 2


@pytest.mark.django_db
def test_create_project_kanban_methodology(superuser, organization):
    project = create_project(
        organization=organization.id,
        name="Kanban Flow",
        key="KNBN",
        slug="kanban-flow",
        creator=superuser,
        methodology="kanban",
    )

    dto = select_project_by_id(project.id)
    assert dto is not None
    assert dto.methodology == "kanban"
    assert dto.board_type == "kanban"
    assert dto.default_sprint_weeks is None


@pytest.mark.django_db
def test_create_project_scrum_custom_sprint_weeks(superuser, organization):
    project = create_project(
        organization=organization.id,
        name="Scrum Four Week",
        key="SC4W",
        slug="scrum-four-week",
        creator=superuser,
        methodology="scrum",
        default_sprint_weeks=4,
    )

    dto = select_project_by_id(project.id)
    assert dto is not None
    assert dto.default_sprint_weeks == 4
