"""
Unit tests for SprintReportCalculator.

Uses DummyObject pattern (same as test_calculators.py) to test the
calculator in isolation from the database.  Covers all 11 scenarios
from the validation matrix.
"""
import pytest
from datetime import date, datetime, timezone
from apps.reports.services.calculators import SprintReportCalculator
from apps.workflow.models import WorkflowStatusCategory


class Obj:
    """Lightweight stand-in for Django model instances."""
    def __init__(self, **kw):
        for k, v in kw.items():
            setattr(self, k, v)


# ── Helpers ──────────────────────────────────────────────────────────

def _status(cat, name=None):
    return Obj(category=cat, name=name or cat)


TODO = _status(WorkflowStatusCategory.TODO, "To Do")
IN_PROGRESS = _status(WorkflowStatusCategory.IN_PROGRESS, "In Progress")
DONE = _status(WorkflowStatusCategory.DONE, "Done")


def _sprint(sid="s1", name="Sprint 1", status="active", start=date(2026, 7, 1),
            end=date(2026, 7, 14)):
    return Obj(id=sid, name=name, status=status, start_date=start,
               end_date=end, updated_at=datetime.now(tz=timezone.utc))


def _commitment(issue_id, sp, status_obj=TODO):
    return Obj(issue_id=issue_id, committed_story_points=sp,
               committed_status=status_obj)


def _issue(iid, key="PROJ-1", title="Test", itype="story", priority="medium",
           sp=5, status_obj=TODO, sprint_id="s1", completed_at=None):
    return Obj(id=iid, key=key, title=title, type=itype, priority=priority,
               story_points=sp, status=status_obj, sprint_id=sprint_id,
               completed_at=completed_at)


def _history(issue_id, to_status, transitioned_at=None):
    if transitioned_at is None:
        transitioned_at = datetime(2026, 7, 5, 12, 0, 0, tzinfo=timezone.utc)
    return Obj(issue_id=issue_id, to_status=to_status,
               transitioned_at=transitioned_at)


def _sp_hist(issue_id, prev, new, created_at=None):
    if created_at is None:
        created_at = datetime(2026, 7, 5, 12, 0, 0, tzinfo=timezone.utc)
    return Obj(issue_id=issue_id, previous_story_points=prev,
               new_story_points=new, created_at=created_at)


def _activity(issue_id, old_value=None, new_value=None, created_at=None):
    if created_at is None:
        created_at = datetime(2026, 7, 3, 12, 0, 0, tzinfo=timezone.utc)
    return Obj(issue_id=issue_id, old_value=old_value, new_value=new_value,
               created_at=created_at)


calc = SprintReportCalculator()


# ── 1. Empty Sprint ─────────────────────────────────────────────────

def test_empty_sprint_no_start_date():
    """Sprint without start_date returns zeroed-out report."""
    sprint = _sprint(start=None)
    result = calc.calculate_sprint_report(
        sprint, None, None, [], [], [], [], [], []
    )
    assert result["sprint_id"] == "s1"
    assert result["summary"]["committed_issues"] == 0
    assert result["summary"]["completed_issues"] == 0
    assert result["completed"] == []
    assert result["incomplete"] == []
    assert result["carry_over"] == []


# ── 2. Active Sprint ────────────────────────────────────────────────

def test_active_sprint_live_metrics():
    """Active sprint computes live metrics, carry-over is empty."""
    sprint = _sprint(status="active")
    issues = [
        _issue("i1", key="PROJ-1", sp=5, status_obj=DONE, completed_at=datetime(2026,7,5, tzinfo=timezone.utc)),
        _issue("i2", key="PROJ-2", sp=3, status_obj=IN_PROGRESS),
    ]
    start_commitments = [
        _commitment("i1", 5),
        _commitment("i2", 3),
    ]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, [], [], []
    )

    assert result["summary"]["committed_issues"] == 2
    assert result["summary"]["committed_story_points"] == 8
    assert result["summary"]["completed_issues"] == 1
    assert result["summary"]["completed_story_points"] == 5
    assert result["summary"]["incomplete_issues"] == 1
    assert result["summary"]["incomplete_story_points"] == 3
    # Active sprint: no carry-over
    assert result["carry_over"] == []
    assert result["summary"]["carry_over_issues"] == 0


# ── 3. Completed Sprint ─────────────────────────────────────────────

def test_completed_sprint_uses_snapshots():
    """Completed sprint uses end snapshot for classification."""
    sprint = _sprint(status="completed")
    issues = [
        _issue("i1", key="PROJ-1", sp=5, status_obj=DONE),
        _issue("i2", key="PROJ-2", sp=3, status_obj=IN_PROGRESS),
    ]
    start_commitments = [_commitment("i1", 5), _commitment("i2", 3)]
    end_commitments = [
        _commitment("i1", 5, DONE),
        _commitment("i2", 3, IN_PROGRESS),
    ]

    result = calc.calculate_sprint_report(
        sprint, Obj(), Obj(), start_commitments, end_commitments,
        issues, [], [], []
    )

    assert result["summary"]["completed_issues"] == 1
    assert result["summary"]["incomplete_issues"] == 1
    assert result["summary"]["carry_over_issues"] == 1
    assert len(result["carry_over"]) == 1
    assert result["carry_over"][0]["key"] == "PROJ-2"


# ── 4. Cancelled Sprint ─────────────────────────────────────────────

def test_cancelled_sprint_carry_over():
    """Cancelled sprint generates carry-over like completed."""
    sprint = _sprint(status="cancelled")
    issues = [_issue("i1", key="PROJ-1", sp=5, status_obj=TODO)]
    start_commitments = [_commitment("i1", 5)]
    end_commitments = [_commitment("i1", 5, TODO)]

    result = calc.calculate_sprint_report(
        sprint, Obj(), Obj(), start_commitments, end_commitments,
        issues, [], [], []
    )

    assert result["summary"]["carry_over_issues"] == 1
    assert result["carry_over"][0]["key"] == "PROJ-1"
    assert result["sprint_status"] == "cancelled"


# ── 5. Issue Added Mid-Sprint ───────────────────────────────────────

def test_issue_added_mid_sprint():
    """Issue not in start snapshot appears as 'added'."""
    sprint = _sprint(status="active")
    # i1 = committed, i2 = added mid-sprint
    issues = [
        _issue("i1", key="PROJ-1", sp=5, status_obj=DONE, completed_at=datetime(2026,7,5, tzinfo=timezone.utc)),
        _issue("i2", key="PROJ-2", sp=3, status_obj=TODO),
    ]
    start_commitments = [_commitment("i1", 5)]
    activities = [_activity("i2", new_value="Sprint 1")]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, [], [], activities
    )

    assert result["summary"]["added_issues"] == 1
    assert result["summary"]["added_story_points"] == 3
    assert len(result["added"]) == 1
    assert result["added"][0]["key"] == "PROJ-2"
    assert result["scope_change"]["issues_added"] == 1


# ── 6. Issue Removed Mid-Sprint ─────────────────────────────────────

def test_issue_removed_mid_sprint():
    """Issue in start snapshot but removed appears in 'removed'."""
    sprint = _sprint(status="active")
    issues = [
        _issue("i1", key="PROJ-1", sp=5, status_obj=DONE, completed_at=datetime(2026,7,5, tzinfo=timezone.utc)),
        _issue("i2", key="PROJ-2", sp=8, status_obj=TODO, sprint_id=None),
    ]
    start_commitments = [_commitment("i1", 5), _commitment("i2", 8)]
    activities = [_activity("i2", old_value="Sprint 1")]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, [], [], activities
    )

    assert result["summary"]["removed_issues"] == 1
    assert result["summary"]["removed_story_points"] == 8
    assert len(result["removed"]) == 1
    assert result["removed"][0]["key"] == "PROJ-2"
    assert result["removed"][0]["committed_story_points"] == 8
    assert result["scope_change"]["issues_removed"] == 1


# ── 7. Story Point Increase ─────────────────────────────────────────

def test_story_point_increase():
    """SP increase after sprint start shows in scope_change.points_added."""
    sprint = _sprint(status="active")
    issues = [_issue("i1", key="PROJ-1", sp=8, status_obj=TODO)]
    start_commitments = [_commitment("i1", 5)]
    # SP changed from 5 to 8 on July 5
    sp_hist = [_sp_hist("i1", 5, 8, datetime(2026, 7, 5, 10, 0, 0, tzinfo=timezone.utc))]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, [], sp_hist, []
    )

    assert result["scope_change"]["points_added"] >= 3  # 8 - 5 = 3 increase


# ── 8. Story Point Decrease ─────────────────────────────────────────

def test_story_point_decrease():
    """SP decrease after sprint start shows in scope_change.points_removed."""
    sprint = _sprint(status="active")
    issues = [_issue("i1", key="PROJ-1", sp=3, status_obj=TODO)]
    start_commitments = [_commitment("i1", 5)]
    sp_hist = [_sp_hist("i1", 5, 3, datetime(2026, 7, 5, 10, 0, 0, tzinfo=timezone.utc))]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, [], sp_hist, []
    )

    assert result["scope_change"]["points_removed"] >= 2  # 5 - 3 = 2 decrease


# ── 9. Reopened Issue ────────────────────────────────────────────────

def test_reopened_issue_becomes_incomplete():
    """Issue that went DONE → IN_PROGRESS shows as incomplete, not completed."""
    sprint = _sprint(status="active")
    issues = [_issue("i1", key="PROJ-1", sp=5, status_obj=IN_PROGRESS, completed_at=None)]
    start_commitments = [_commitment("i1", 5)]
    # History: TODO → DONE → IN_PROGRESS (reopened)
    histories = [
        _history("i1", DONE, datetime(2026, 7, 5, 10, 0, 0, tzinfo=timezone.utc)),
        _history("i1", IN_PROGRESS, datetime(2026, 7, 7, 10, 0, 0, tzinfo=timezone.utc)),
    ]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, histories, [], []
    )

    assert result["summary"]["completed_issues"] == 0
    assert result["summary"]["incomplete_issues"] == 1
    assert len(result["incomplete"]) == 1
    assert result["incomplete"][0]["key"] == "PROJ-1"
    assert result["summary"]["completion_percentage"] == 0.0


# ── 10. Carry-over (Incomplete at Completion) ───────────────────────

def test_carry_over_at_completion():
    """Only incomplete issues at sprint completion become carry-over."""
    sprint = _sprint(status="completed")
    issues = [
        _issue("i1", key="PROJ-1", sp=5, status_obj=DONE),
        _issue("i2", key="PROJ-2", sp=3, status_obj=IN_PROGRESS),
        _issue("i3", key="PROJ-3", sp=2, status_obj=TODO),
    ]
    start_commitments = [
        _commitment("i1", 5), _commitment("i2", 3), _commitment("i3", 2),
    ]
    end_commitments = [
        _commitment("i1", 5, DONE),
        _commitment("i2", 3, IN_PROGRESS),
        _commitment("i3", 2, TODO),
    ]

    result = calc.calculate_sprint_report(
        sprint, Obj(), Obj(), start_commitments, end_commitments,
        issues, [], [], []
    )

    assert result["summary"]["carry_over_issues"] == 2
    assert result["summary"]["carry_over_story_points"] == 5
    carry_keys = {c["key"] for c in result["carry_over"]}
    assert carry_keys == {"PROJ-2", "PROJ-3"}


# ── 11. Multiple Sprint Completions (independent reports) ───────────

def test_independent_sprint_reports():
    """Two separate sprints produce independent, correct reports."""
    calc_ = SprintReportCalculator()

    # Sprint A
    sprint_a = _sprint(sid="sa", name="Sprint A", status="completed")
    issues_a = [_issue("ia1", key="A-1", sp=5, status_obj=DONE)]
    start_a = [_commitment("ia1", 5)]
    end_a = [_commitment("ia1", 5, DONE)]

    result_a = calc_.calculate_sprint_report(
        sprint_a, Obj(), Obj(), start_a, end_a, issues_a, [], [], []
    )

    # Sprint B
    sprint_b = _sprint(sid="sb", name="Sprint B", status="completed")
    issues_b = [_issue("ib1", key="B-1", sp=8, status_obj=TODO)]
    start_b = [_commitment("ib1", 8)]
    end_b = [_commitment("ib1", 8, TODO)]

    result_b = calc_.calculate_sprint_report(
        sprint_b, Obj(), Obj(), start_b, end_b, issues_b, [], [], []
    )

    # Independent
    assert result_a["sprint_id"] == "sa"
    assert result_a["summary"]["completed_issues"] == 1
    assert result_a["summary"]["carry_over_issues"] == 0

    assert result_b["sprint_id"] == "sb"
    assert result_b["summary"]["completed_issues"] == 0
    assert result_b["summary"]["carry_over_issues"] == 1


# ── Completion Percentages ──────────────────────────────────────────

def test_completion_percentages():
    """Verify completion_percentage and story_point_completion_percentage."""
    sprint = _sprint(status="active")
    issues = [
        _issue("i1", key="P-1", sp=5, status_obj=DONE, completed_at=datetime(2026,7,5, tzinfo=timezone.utc)),
        _issue("i2", key="P-2", sp=3, status_obj=DONE, completed_at=datetime(2026,7,6, tzinfo=timezone.utc)),
        _issue("i3", key="P-3", sp=2, status_obj=TODO),
    ]
    start_commitments = [
        _commitment("i1", 5), _commitment("i2", 3), _commitment("i3", 2),
    ]

    result = calc.calculate_sprint_report(
        sprint, Obj(), None, start_commitments, [],
        issues, [], [], []
    )

    # 2/3 issues = 66.67%
    assert result["summary"]["completion_percentage"] == 66.67
    # 8/10 SP = 80.0%
    assert result["summary"]["story_point_completion_percentage"] == 80.0
