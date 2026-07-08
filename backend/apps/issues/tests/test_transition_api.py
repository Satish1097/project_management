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
    # IssueSerializer returns status as {id, name, category, color, order, is_default}
    # (no slug field — slug is only present on Kanban board responses)
    data = response.json()["data"]["issue"]
    assert data["status"]["category"] == "in_progress"


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

    # Jumping directly from "todo" to "done" (skipping in_progress → in_review) is
    # rejected. The permission layer checks can_transition_issue first; developers
    # lack approval rights so a 403 is returned before the 400 workflow validation.
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
    # Verify the status moved to the "done" category
    data = response.json()["data"]["issue"]
    assert data["status"]["category"] == "done"
