import pytest



from apps.contracts.workflow_contract import get_status_by_slug

from apps.issues.models import Issue

from apps.issues.services.issue_service import issue_service

from apps.organizations.models import OrganizationRole
from apps.organizations.services import create_organization

from apps.organizations.services.membership_service import add_organization_member

from apps.projects.models import ProjectRole

from apps.projects.services import create_project

from apps.projects.services.membership_service import add_project_member

from apps.sprints.services.sprint_service import sprint_service





@pytest.mark.django_db

def test_workspace_dashboard_returns_scoped_data(

    manager_client,

    project_with_manager,

    superuser,

    organization,

):

    todo_status = get_status_by_slug(project_with_manager.id, "todo")

    done_status = get_status_by_slug(project_with_manager.id, "done")

    assert todo_status is not None

    assert done_status is not None



    Issue.objects.create(

        project_id=project_with_manager.id,

        key="HRMS-101",

        title="Open dashboard issue",

        description="",

        priority="medium",

        status_id=todo_status.id,

        reporter_id=superuser.id,

    )

    Issue.objects.create(

        project_id=project_with_manager.id,

        key="HRMS-102",

        title="Done dashboard issue",

        description="",

        priority="medium",

        status_id=done_status.id,

        reporter_id=superuser.id,

    )



    sprint = sprint_service.create_sprint(

        user=superuser,

        project_id=project_with_manager.id,

        name="Dashboard Sprint",

    )

    sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)



    response = manager_client.get(f"/api/organizations/{organization.id}/dashboard")



    assert response.status_code == 200

    data = response.json()["data"]

    projects = data["projects"]

    assert len(projects) >= 1

    project = next(item for item in projects if item["id"] == str(project_with_manager.id))

    assert project["name"] == project_with_manager.name

    assert project["open_issue_count"] >= 1

    assert project["progress_percent"] == 50

    assert project["active_sprint"]["name"] == "Dashboard Sprint"



    summary = data["summary"]

    assert summary["total_visible_projects"] >= 1

    assert summary["open_issues"] >= 1

    assert summary["active_sprints"] >= 1



    active_sprints = data["active_sprints"]

    assert len(active_sprints) >= 1

    assert active_sprints[0]["sprint"]["name"] == "Dashboard Sprint"





@pytest.mark.django_db

def test_workspace_dashboard_assigned_tasks_returns_open_issues(

    manager_client,

    project_with_manager,

    superuser,

    project_manager_user,

    organization,

):

    issue = issue_service.create_issue(

        user=superuser,

        project_id=project_with_manager.id,

        title="Assigned dashboard task",

        assignee_id=project_manager_user.id,

    )



    response = manager_client.get(f"/api/organizations/{organization.id}/dashboard")



    assert response.status_code == 200

    tasks = response.json()["data"]["tasks"]

    assert len(tasks) >= 1

    assert tasks[0]["id"] == str(issue.id)

    assert tasks[0]["title"] == "Assigned dashboard task"

    assert tasks[0]["project"]["id"] == str(project_with_manager.id)





@pytest.mark.django_db

def test_workspace_dashboard_does_not_aggregate_other_workspaces(

    manager_client,

    project_with_manager,

    project_manager_user,

    superuser,

    organization,

):

    other_org = create_organization(
        name="Other Workspace",
        slug="other-workspace",
        owner_user_id=superuser.id,
        creator=superuser,
    )

    add_organization_member(

        organization_id=other_org.id,

        user_id=project_manager_user.id,

        role=OrganizationRole.MEMBER,

        added_by=superuser,

    )

    other_project = create_project(

        organization=other_org.id,

        name="Other Project",

        key="OTHER",

        slug="other",

        creator=superuser,

        visibility="organization",

    )

    add_project_member(

        project_id=other_project.id,

        user_id=project_manager_user.id,

        added_by=superuser,

        role=ProjectRole.DEVELOPER,

    )



    issue_service.create_issue(

        user=superuser,

        project_id=other_project.id,

        title="Issue in other workspace",

        assignee_id=project_manager_user.id,

    )



    response = manager_client.get(f"/api/organizations/{organization.id}/dashboard")



    assert response.status_code == 200

    data = response.json()["data"]

    project_ids = {item["id"] for item in data["projects"]}

    assert str(other_project.id) not in project_ids

    assert all(task["project"]["id"] != str(other_project.id) for task in data["tasks"])


