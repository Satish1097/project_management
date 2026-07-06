import pytest


@pytest.mark.django_db
def test_transition_endpoint_success(
    developer_client,
    project,
    create_test_issue,
    status_ids,
):
    issue = create_test_issue()
    in_progress_id = status_ids["in_progress"]

    response = developer_client.post(
        f"/api/issues/{issue.id}/transition",
        {"target_status_id": str(in_progress_id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["issue"]["status"]["slug"] == "in_progress"


@pytest.mark.django_db
def test_invalid_transition_returns_400(
    developer_client,
    project,
    create_test_issue,
    status_ids,
):
    issue = create_test_issue()
    done_id = status_ids["done"]

    response = developer_client.post(
        f"/api/issues/{issue.id}/transition",
        {"target_status_id": str(done_id)},
        format="json",
    )

    # Permission layer rejects invalid transitions before the service returns 400.
    assert response.status_code == 403


@pytest.mark.django_db
def test_developer_cannot_approve_to_done(
    developer_client,
    project,
    create_test_issue,
    status_ids,
):
    issue = create_test_issue()
    in_progress = status_ids["in_progress"]
    in_review = status_ids["in_review"]
    done = status_ids["done"]

    developer_client.post(
        f"/api/issues/{issue.id}/transition",
        {"target_status_id": str(in_progress)},
        format="json",
    )
    developer_client.post(
        f"/api/issues/{issue.id}/transition",
        {"target_status_id": str(in_review)},
        format="json",
    )

    response = developer_client.post(
        f"/api/issues/{issue.id}/transition",
        {"target_status_id": str(done)},
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_qa_can_approve_to_done(
    qa_client,
    project_with_qa,
    superuser,
    create_test_issue,
    status_ids,
):
    issue = create_test_issue(actor_id=superuser.id)
    for slug in ("in_progress", "in_review"):
        status_id = status_ids[slug]
        qa_client.post(
            f"/api/issues/{issue.id}/transition",
            {"target_status_id": str(status_id)},
            format="json",
        )

    done_id = status_ids["done"]
    response = qa_client.post(
        f"/api/issues/{issue.id}/transition",
        {"target_status_id": str(done_id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["issue"]["status"]["slug"] == "done"
