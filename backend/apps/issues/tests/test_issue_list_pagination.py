import pytest


def _list_issues(superuser_client, project_id, **params):
    return superuser_client.get("/api/issues", {"project": str(project_id), **params})


@pytest.mark.django_db
def test_issue_list_pagination_default_page_size(superuser_client, project, create_test_issue):
    for index in range(30):
        create_test_issue(title=f"Issue {index}")

    response = _list_issues(superuser_client, project.id, page=1)
    payload = response.json()["data"]

    assert response.status_code == 200
    assert len(payload["results"]) == 15
    assert payload["count"] == 30
    assert payload["next"] is not None
    assert payload["previous"] is None


@pytest.mark.django_db
def test_issue_list_pagination_second_page(superuser_client, project, create_test_issue):
    for index in range(50):
        create_test_issue(title=f"Issue {index}")

    page_one = _list_issues(superuser_client, project.id, page=1, page_size=10).json()["data"]
    page_two = _list_issues(superuser_client, project.id, page=2, page_size=10).json()["data"]

    assert len(page_one["results"]) == 10
    assert len(page_two["results"]) == 10
    assert page_two["previous"] is not None
    assert page_two["next"] is not None

    page_one_ids = {issue["id"] for issue in page_one["results"]}
    page_two_ids = {issue["id"] for issue in page_two["results"]}
    assert page_one_ids.isdisjoint(page_two_ids)


@pytest.mark.django_db
@pytest.mark.parametrize("total_issues", [50, 100, 500])
def test_issue_list_pagination_returns_only_current_page(
    superuser_client,
    project,
    create_test_issue,
    total_issues,
):
    for index in range(total_issues):
        create_test_issue(title=f"Issue {index}")

    response = _list_issues(
        superuser_client,
        project.id,
        page=2,
        page_size=10,
    )
    payload = response.json()["data"]

    assert len(payload["results"]) == 15
    assert payload["count"] == total_issues


@pytest.mark.django_db
def test_issue_list_pagination_preserves_filters(
    superuser_client,
    project,
    create_test_issue,
    superuser,
):
    create_test_issue(title="Assigned issue", assignee_id=superuser.id)
    create_test_issue(title="Unassigned issue")

    response = _list_issues(
        superuser_client,
        project.id,
        page=1,
        assignee="unassigned",
    )
    payload = response.json()["data"]

    assert payload["count"] == 1
    assert payload["results"][0]["title"] == "Unassigned issue"


@pytest.mark.django_db
def test_issue_list_pagination_preserves_search(
    superuser_client,
    project,
    create_test_issue,
):
    create_test_issue(title="Login API")
    create_test_issue(title="Logout flow")

    response = _list_issues(
        superuser_client,
        project.id,
        page=1,
        search="Login",
    )
    payload = response.json()["data"]

    assert payload["count"] == 1
    assert payload["results"][0]["title"] == "Login API"


@pytest.mark.django_db
def test_issue_list_pagination_max_page_size(superuser_client, project, create_test_issue):
    for index in range(150):
        create_test_issue(title=f"Issue {index}")

    response = _list_issues(superuser_client, project.id, page=1, page_size=200)
    payload = response.json()["data"]

    assert len(payload["results"]) == 150
    assert payload["count"] == 150


@pytest.mark.django_db
def test_issue_list_unpaginated_response_unchanged(superuser_client, project, create_test_issue):
    create_test_issue(title="Single issue")

    response = _list_issues(superuser_client, project.id)
    payload = response.json()["data"]

    assert "issues" in payload
    assert len(payload["issues"]) == 1
    assert "pagination" not in payload
    assert "count" not in payload
