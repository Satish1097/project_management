import pytest

from apps.organizations.models import OrganizationRole
from apps.organizations.services.membership_service import add_organization_member
from apps.permissions.services import permission_service
from apps.projects.models import ProjectRole
from apps.projects.services import create_project
from apps.projects.services.membership_service import add_project_member


@pytest.mark.django_db
class TestOrganizationPermissions:
    def test_can_view_organization_active_member(self, superuser, organization, other_user):
        add_organization_member(
            organization_id=organization.id,
            user_id=other_user.id,
            added_by=superuser,
        )

        assert permission_service.can_view_organization(other_user.id, organization.id) is True

    def test_can_view_organization_inactive_member_denied(
        self,
        superuser,
        organization,
        other_user,
    ):
        add_organization_member(
            organization_id=organization.id,
            user_id=other_user.id,
            added_by=superuser,
        )
        from apps.organizations.services.membership_service import remove_organization_member

        remove_organization_member(
            organization_id=organization.id,
            user_id=other_user.id,
        )

        assert permission_service.can_view_organization(other_user.id, organization.id) is False

    def test_can_manage_organization_owner(self, superuser, organization):
        assert permission_service.can_manage_organization(superuser.id, organization.id) is True

    def test_can_manage_organization_admin(self, superuser, organization, org_admin):
        add_organization_member(
            organization_id=organization.id,
            user_id=org_admin.id,
            added_by=superuser,
            role=OrganizationRole.ADMIN,
        )

        assert permission_service.can_manage_organization(org_admin.id, organization.id) is True

    def test_can_manage_organization_member_denied(self, superuser, organization, user):
        add_organization_member(
            organization_id=organization.id,
            user_id=user.id,
            added_by=superuser,
            role=OrganizationRole.MEMBER,
        )

        assert permission_service.can_manage_organization(user.id, organization.id) is False

    def test_can_create_project_active_org_member(self, superuser, organization, user):
        add_organization_member(
            organization_id=organization.id,
            user_id=user.id,
            added_by=superuser,
            role=OrganizationRole.MEMBER,
        )

        assert permission_service.can_create_project(superuser.id, organization.id) is True
        assert permission_service.can_create_project(user.id, organization.id) is True


@pytest.mark.django_db
class TestProjectPermissions:
    def test_can_view_project_organization_visibility(
        self,
        superuser,
        organization,
        user,
        other_user,
    ):
        project = create_project(
            organization=organization.id,
            name="Visible Project",
            key="VIS",
            slug="visible-project",
            creator=superuser,
            visibility="organization",
        )
        add_organization_member(
            organization_id=organization.id,
            user_id=user.id,
            added_by=superuser,
            role=OrganizationRole.MEMBER,
        )

        assert permission_service.can_view_project(user.id, project.id) is True
        assert permission_service.can_view_project(other_user.id, project.id) is False

    def test_can_view_project_private_member_only(
        self,
        superuser,
        organization,
        project,
        other_user,
    ):
        assert permission_service.can_view_project(superuser.id, project.id) is True
        assert permission_service.can_view_project(other_user.id, project.id) is False

        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
            role=ProjectRole.VIEWER,
        )

        assert permission_service.can_view_project(other_user.id, project.id) is True

    def test_can_edit_project_admin_and_manager(self, superuser, organization, project, user):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.PROJECT_MANAGER,
        )

        assert permission_service.can_edit_project(superuser.id, project.id) is True
        assert permission_service.can_edit_project(user.id, project.id) is True

    def test_can_edit_project_developer_and_viewer_denied(
        self,
        superuser,
        organization,
        project,
        user,
        other_user,
    ):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )
        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
            role=ProjectRole.VIEWER,
        )

        assert permission_service.can_edit_project(user.id, project.id) is False
        assert permission_service.can_edit_project(other_user.id, project.id) is False

    def test_can_manage_members_project_admin_and_manager(
        self,
        superuser,
        organization,
        project,
        user,
    ):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.PROJECT_MANAGER,
        )

        assert permission_service.can_manage_members(superuser.id, project.id) is True
        assert permission_service.can_manage_members(user.id, project.id) is True

    def test_can_manage_workflow_returns_false_until_workflow_phase(
        self,
        superuser,
        organization,
        project,
    ):
        assert permission_service.can_manage_workflow(superuser.id, project.id) is False


@pytest.mark.django_db
class TestPhase3IssuePermissions:
    def test_can_create_issue_by_role(self, superuser, project, user, other_user):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )
        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
            role=ProjectRole.VIEWER,
        )

        assert permission_service.can_create_issue(superuser.id, project.id) is True
        assert permission_service.can_create_issue(user.id, project.id) is True
        assert permission_service.can_create_issue(other_user.id, project.id) is False

    def test_can_assign_issue_qa_denied_developer_allowed(
        self,
        superuser,
        project,
        user,
        other_user,
    ):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )
        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
            role=ProjectRole.QA,
        )

        assert permission_service.can_assign_issue(user.id, project.id) is True
        assert permission_service.can_assign_issue(other_user.id, project.id) is False

    def test_can_transition_issue_viewer_denied(self, superuser, project, user):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.VIEWER,
        )

        assert (
            permission_service.can_transition_issue(
                user.id,
                project.id,
                "todo",
                "in_progress",
            )
            is False
        )

    def test_can_transition_issue_developer_cannot_approve(
        self,
        superuser,
        project,
        user,
    ):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )

        assert (
            permission_service.can_transition_issue(
                user.id,
                project.id,
                "in_review",
                "done",
            )
            is False
        )
        assert (
            permission_service.can_transition_issue(
                superuser.id,
                project.id,
                "in_review",
                "done",
            )
            is True
        )

    def test_can_transition_issue_reopen_restricted(
        self,
        superuser,
        project,
        user,
        other_user,
    ):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )
        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
            role=ProjectRole.QA,
        )

        assert (
            permission_service.can_transition_issue(
                user.id,
                project.id,
                "done",
                "in_review",
            )
            is False
        )
        assert (
            permission_service.can_transition_issue(
                other_user.id,
                project.id,
                "done",
                "in_review",
            )
            is False
        )
        assert (
            permission_service.can_transition_issue(
                superuser.id,
                project.id,
                "done",
                "in_review",
            )
            is True
        )


@pytest.mark.django_db
class TestPhase3SprintPermissions:
    def test_can_manage_sprint_manager_allowed_developer_denied(
        self,
        superuser,
        project,
        user,
    ):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )

        assert permission_service.can_manage_sprint(superuser.id, project.id) is True
        assert permission_service.can_manage_sprint(user.id, project.id) is False

    def test_can_plan_sprint_developer_and_qa(self, superuser, project, user, other_user):
        add_project_member(
            project_id=project.id,
            user_id=user.id,
            added_by=superuser,
            role=ProjectRole.DEVELOPER,
        )
        add_project_member(
            project_id=project.id,
            user_id=other_user.id,
            added_by=superuser,
            role=ProjectRole.QA,
        )

        assert permission_service.can_plan_sprint(user.id, project.id) is True
        assert permission_service.can_plan_sprint(other_user.id, project.id) is True
        assert permission_service.can_plan_sprint(superuser.id, project.id) is True


@pytest.fixture
def organization(superuser):
    from apps.organizations.services import create_organization

    return create_organization(
        name="Permission Org",
        slug="permission-org",
        owner_user_id=superuser.id,
        creator=superuser,
    )


@pytest.fixture
def superuser(db):
    from apps.accounts.models import User, UserPreference, UserProfile

    user = User.objects.create_superuser(
        email="perm-super@example.com",
        password="StrongPassword123",
    )
    UserProfile.objects.create(user=user, first_name="Perm", last_name="Super")
    UserPreference.objects.create(user=user)
    return user


@pytest.fixture
def user(db):
    from apps.accounts.models import User, UserPreference, UserProfile

    user = User.objects.create_user(email="perm-user@example.com", password="StrongPassword123")
    UserProfile.objects.create(user=user, first_name="Perm", last_name="User")
    UserPreference.objects.create(user=user)
    return user


@pytest.fixture
def other_user(db):
    from apps.accounts.models import User, UserPreference, UserProfile

    user = User.objects.create_user(email="perm-other@example.com", password="StrongPassword123")
    UserProfile.objects.create(user=user, first_name="Perm", last_name="Other")
    UserPreference.objects.create(user=user)
    return user


@pytest.fixture
def org_admin(db):
    from apps.accounts.models import User, UserPreference, UserProfile

    user = User.objects.create_user(email="perm-admin@example.com", password="StrongPassword123")
    UserProfile.objects.create(user=user, first_name="Perm", last_name="Admin")
    UserPreference.objects.create(user=user)
    return user


@pytest.fixture
def project(superuser, organization):
    return create_project(
        organization=organization.id,
        name="Permission Project",
        key="PERM",
        slug="permission-project",
        creator=superuser,
    )
