import pytest
from datetime import date, timedelta
from django.utils import timezone
from apps.reports.services.calculators import BurndownCalculator
from apps.workflow.models import WorkflowStatusCategory


class DummyObject:
    def __init__(self, **kwargs):
        for k, v in kwargs.items():
            setattr(self, k, v)


def test_burndown_calculator_empty_sprint():
    """Test calculator returns empty structure if start_date is not set."""
    sprint = DummyObject(id="s1", name="Sprint 1", start_date=None, status="planned")
    calc = BurndownCalculator()
    res = calc.calculate_burndown(sprint, None, [], [], [], [], [])
    assert res["committed_points"] == 0
    assert res["data_points"] == []


def test_burndown_calculator_ideal_line():
    """Test linear ideal line calculation."""
    start = date(2026, 7, 1)
    end = date(2026, 7, 5) # 4 days total
    sprint = DummyObject(id="s1", name="Sprint 1", start_date=start, end_date=end, status="active", updated_at=timezone.now())
    
    commitments = [
        DummyObject(issue_id="i1", committed_story_points=5, committed_status=DummyObject(category=WorkflowStatusCategory.TODO)),
        DummyObject(issue_id="i2", committed_story_points=8, committed_status=DummyObject(category=WorkflowStatusCategory.TODO))
    ]
    
    calc = BurndownCalculator()
    res = calc.calculate_burndown(sprint, None, commitments, [], [], [], [])
    
    assert res["committed_points"] == 13
    assert res["committed_issues"] == 2
    
    # 5 dates in list: 7/1, 7/2, 7/3, 7/4, 7/5
    dp = res["data_points"]
    assert len(dp) >= 5
    
    # Check ideal line values
    # Total days = 4 (7/1 to 7/5)
    # idx 0: 7/1 -> ratio 1 -> 13
    # idx 1: 7/2 -> ratio 0.75 -> 9.75
    # idx 2: 7/3 -> ratio 0.50 -> 6.50
    # idx 3: 7/4 -> ratio 0.25 -> 3.25
    # idx 4: 7/5 -> ratio 0.0 -> 0.0
    assert dp[0]["ideal_points"] == 13.0
    assert dp[1]["ideal_points"] == 9.75
    assert dp[2]["ideal_points"] == 6.50
    assert dp[3]["ideal_points"] == 3.25
    assert dp[4]["ideal_points"] == 0.0
