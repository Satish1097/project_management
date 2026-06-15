import pytest

from apps.contracts.workflow_contract import (
    get_allowed_transitions,
    get_status_by_slug,
    get_workflow_config,
)
from apps.workflow.constants import DEFAULT_STATUSES, DEFAULT_TRANSITIONS
from apps.workflow.selectors import (
    select_allowed_transitions,
    select_is_valid_transition,
    select_status_by_slug,
    select_workflow_config,
)


@pytest.mark.django_db
def test_select_workflow_config_matches_contract(project):
    direct = select_workflow_config(project.id)
    via_contract = get_workflow_config(project.id)

    assert direct.project_id == via_contract.project_id
    assert len(direct.statuses) == len(via_contract.statuses)
    assert len(direct.transitions) == len(via_contract.transitions)


@pytest.mark.django_db
def test_select_status_by_slug(project):
    status = select_status_by_slug(project.id, "todo")
    contract_status = get_status_by_slug(project.id, "todo")

    assert status is not None
    assert status.slug == contract_status.slug == "todo"
    assert status.is_default is True


@pytest.mark.django_db
def test_select_is_valid_transition(project):
    assert select_is_valid_transition(project.id, "todo", "in_progress") is True
    assert select_is_valid_transition(project.id, "todo", "done") is False


@pytest.mark.django_db
def test_select_allowed_transitions_from_todo(project):
    transitions = select_allowed_transitions(project.id, "todo")
    contract_transitions = get_allowed_transitions(project.id, "todo")

    assert len(transitions) == len(contract_transitions)
    to_slugs = {t.to_status_slug for t in transitions}
    assert "in_progress" in to_slugs
    assert "blocked" in to_slugs


@pytest.mark.django_db
def test_frozen_status_count(project):
    config = select_workflow_config(project.id)
    assert len(config.statuses) == len(DEFAULT_STATUSES)
    assert len(config.transitions) == len(DEFAULT_TRANSITIONS)
