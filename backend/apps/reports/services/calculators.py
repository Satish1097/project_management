"""
Stateless Metrics Engine - reusable calculators containing metrics formulas.
These calculators do NOT perform database operations.
"""
from datetime import datetime, date, time, timedelta, timezone
from django.utils import timezone as django_timezone
from apps.workflow.models import WorkflowStatusCategory


class BurndownCalculator:
    """
    Computes daily sprint burndown metrics including ideal lines and actuals.
    Handles story points and issue counts, scope changes (additions/removals),
    sizing changes, and reopened issues retrospectively.
    """

    def calculate_burndown(
        self,
        sprint,
        start_snapshot,
        commitments,
        issues,
        status_histories,
        story_point_histories,
        activities
    ) -> dict:
        """
        Calculates daily burndown points.

        Args:
            sprint: The Sprint model instance.
            start_snapshot: The SprintSnapshot of type "start" (or None).
            commitments: List/QuerySet of SprintIssueCommitment records.
            issues: List/QuerySet of Issue records ever associated with the sprint.
            status_histories: List/QuerySet of IssueStatusHistory records for these issues.
            story_point_histories: List/QuerySet of StoryPointHistory records for these issues.
            activities: List/QuerySet of IssueActivity (sprint changes) records.
        """
        # 1. Timeline configuration
        start_date = sprint.start_date
        if not start_date:
            return {
                "sprint_id": str(sprint.id),
                "sprint_name": sprint.name,
                "committed_points": 0,
                "committed_issues": 0,
                "data_points": []
            }

        # Determine completion date if completed
        completed_date = None
        if sprint.status == "completed":
            # If we have an end snapshot, use its date, else fallback to sprint.updated_at
            completed_date = sprint.updated_at.date()

        today = django_timezone.now().date()
        end_date = sprint.end_date or start_date
        max_date = max(end_date, today)
        if completed_date:
            max_date = max(max_date, completed_date)

        # Dates list
        dates = []
        curr = start_date
        while curr <= max_date:
            dates.append(curr)
            curr += timedelta(days=1)

        # 2. Map snapshot commitments
        committed_issue_ids = {c.issue_id for c in commitments}
        commitment_map = {c.issue_id: c for c in commitments}

        # Group histories by issue_id for O(1) lookups
        histories_by_issue = {}
        for h in status_histories:
            histories_by_issue.setdefault(h.issue_id, []).append(h)

        points_by_issue = {}
        for p in story_point_histories:
            points_by_issue.setdefault(p.issue_id, []).append(p)

        activities_by_issue = {}
        for a in activities:
            activities_by_issue.setdefault(a.issue_id, []).append(a)

        # Calculate committed points and counts
        committed_points = 0
        committed_issues = len(committed_issue_ids)
        for c in commitments:
            committed_points += (c.committed_story_points or 0)

        # Fallback if no start snapshot exists (e.g. planned or failed snapshot)
        if not commitments:
            # Committed is the current set of sprint issues at sprint start date
            # We will approximate based on issues currently assigned and not added later
            committed_issues = 0
            for issue in issues:
                is_committed = True
                issue_acts = activities_by_issue.get(issue.id, [])
                for act in issue_acts:
                    # If it was added to this sprint after start_date, it wasn't committed
                    act_date = act.created_at.date()
                    if act.new_value == sprint.name and act_date > start_date:
                        is_committed = False
                        break
                if is_committed:
                    committed_issues += 1
                    committed_points += (issue.story_points or 0)

        # 3. Ideal Remaining Calculation
        total_days = (end_date - start_date).days
        if total_days <= 0:
            total_days = 1

        ideal_points_by_date = {}
        ideal_issues_by_date = {}
        for idx, d in enumerate(dates):
            days_elapsed = (d - start_date).days
            if days_elapsed >= total_days:
                ideal_points_by_date[d] = 0.0
                ideal_issues_by_date[d] = 0.0
            else:
                ratio = 1.0 - (days_elapsed / total_days)
                ideal_points_by_date[d] = round(committed_points * ratio, 2)
                ideal_issues_by_date[d] = round(committed_issues * ratio, 2)

        # 4. Actual Remaining Calculation for each date
        data_points = []
        sprint_name = sprint.name

        for d in dates:
            # Evaluate at 23:59:59 UTC
            eval_time = datetime.combine(d, time(23, 59, 59), tzinfo=timezone.utc)
            
            # If it's a future date, we do NOT compute actual remaining points (rendered as null/None in chart)
            if d > today:
                data_points.append({
                    "date": d.isoformat(),
                    "remaining_points": None,
                    "remaining_issues": None,
                    "ideal_points": ideal_points_by_date[d],
                    "ideal_issues": ideal_issues_by_date[d]
                })
                continue

            remaining_points = 0
            remaining_issues = 0

            for issue in issues:
                # A. Determine if issue is in sprint at eval_time
                in_sprint = (issue.id in committed_issue_ids) if commitments else (issue.sprint_id == sprint.id)
                
                issue_activities = activities_by_issue.get(issue.id, [])
                for act in issue_activities:
                    if act.created_at > eval_time:
                        break
                    # If unassigned from this sprint
                    if act.old_value == sprint_name:
                        in_sprint = False
                    # If assigned to this sprint
                    elif act.new_value == sprint_name:
                        in_sprint = True

                if not in_sprint:
                    continue

                # B. Determine issue story points at eval_time
                issue_points = None
                pt_hist = points_by_issue.get(issue.id, [])
                for pt in pt_hist:
                    if pt.created_at > eval_time:
                        break
                    issue_points = pt.new_story_points

                if issue_points is None:
                    comm = commitment_map.get(issue.id)
                    if comm:
                        issue_points = comm.committed_story_points
                    else:
                        issue_points = issue.story_points

                issue_points_val = issue_points or 0

                # C. Determine issue category at eval_time
                issue_category = None
                status_hist = histories_by_issue.get(issue.id, [])
                for transition in status_hist:
                    if transition.transitioned_at > eval_time:
                        break
                    issue_category = transition.to_status.category

                if issue_category is None:
                    comm = commitment_map.get(issue.id)
                    if comm:
                        issue_category = comm.committed_status.category
                    else:
                        issue_category = issue.status.category

                # D. Evaluate remaining work
                if issue_category != WorkflowStatusCategory.DONE:
                    remaining_points += issue_points_val
                    remaining_issues += 1

            data_points.append({
                "date": d.isoformat(),
                "remaining_points": remaining_points,
                "remaining_issues": remaining_issues,
                "ideal_points": ideal_points_by_date[d],
                "ideal_issues": ideal_issues_by_date[d]
            })

        return {
            "sprint_id": str(sprint.id),
            "sprint_name": sprint.name,
            "committed_points": committed_points,
            "committed_issues": committed_issues,
            "data_points": data_points
        }


class SharedDeliveryMetricsCalculator:
    """
    Computes baseline committed and completed metrics from immutable snapshots.
    Useful for velocity and sprint reports to share identical baseline calculations.
    """
    def get_committed_metrics(self, start_commitments) -> dict:
        committed_issues = len(start_commitments)
        committed_sp = sum((c.committed_story_points or 0) for c in start_commitments)
        return {
            "committed_issues": committed_issues,
            "committed_story_points": committed_sp,
        }

    def get_completed_metrics_from_snapshot(self, end_commitments) -> dict:
        completed_issues = 0
        completed_sp = 0
        total_sp_at_end = 0
        for c in end_commitments:
            total_sp_at_end += (c.committed_story_points or 0)
            if c.committed_status.category == WorkflowStatusCategory.DONE:
                completed_issues += 1
                completed_sp += (c.committed_story_points or 0)
        return {
            "completed_issues": completed_issues,
            "completed_story_points": completed_sp,
            "total_story_points_at_end": total_sp_at_end,
        }


DEFAULT_VELOCITY_ROLLING_WINDOW = 5


class VelocityCalculator:
    """Calculates sprint velocity trends and running averages using immutable snapshots."""

    def __init__(self):
        self.shared_calc = SharedDeliveryMetricsCalculator()

    def calculate_velocity(self, sprint_data_list: list[dict]) -> dict:
        history = []
        completed_velocity_rows = []

        for data in sprint_data_list:
            sprint = data["sprint"]
            if sprint.status == "cancelled":
                history.append({
                    "sprint_id": str(sprint.id),
                    "sprint_name": sprint.name,
                    "status": "cancelled",
                    "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                    "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                    "committed_story_points": 0,
                    "completed_story_points": 0,
                    "commitment_percentage": 0.0,
                    "completion_percentage": 0.0,
                    "rolling_average": None,
                })
                continue

            committed = self.shared_calc.get_committed_metrics(data["start_commitments"])
            completed = self.shared_calc.get_completed_metrics_from_snapshot(data["end_commitments"])

            comm_sp = committed["committed_story_points"]
            comp_sp = completed["completed_story_points"]
            total_end_sp = completed["total_story_points_at_end"]

            commitment_pct = round((comp_sp / comm_sp * 100), 2) if comm_sp > 0 else 0.0
            completion_pct = round((comp_sp / total_end_sp * 100), 2) if total_end_sp > 0 else 0.0

            row = {
                "sprint_id": str(sprint.id),
                "sprint_name": sprint.name,
                "status": sprint.status,
                "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
                "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
                "committed_story_points": comm_sp,
                "completed_story_points": comp_sp,
                "commitment_percentage": commitment_pct,
                "completion_percentage": completion_pct,
                "rolling_average": None,
            }

            if sprint.status == "completed":
                completed_velocity_rows.append(row)
                rolling_window = completed_velocity_rows[-DEFAULT_VELOCITY_ROLLING_WINDOW:]
                row["rolling_average"] = round(
                    sum(h["completed_story_points"] for h in rolling_window) / len(rolling_window),
                    2,
                )

            history.append(row)

        rolling_window = completed_velocity_rows[-DEFAULT_VELOCITY_ROLLING_WINDOW:]
        rolling_average_value = (
            round(sum(h["completed_story_points"] for h in rolling_window) / len(rolling_window), 2)
            if rolling_window else 0.0
        )

        average_velocity = (
            round(
                sum(h["completed_story_points"] for h in completed_velocity_rows)
                / len(completed_velocity_rows),
                2,
            )
            if completed_velocity_rows else 0.0
        )

        trend_direction = "stable"
        previous_velocity = None
        latest_velocity = None
        delta = 0
        delta_percentage = 0.0
        if len(completed_velocity_rows) >= 2:
            previous_velocity = completed_velocity_rows[-2]["completed_story_points"]
            latest_velocity = completed_velocity_rows[-1]["completed_story_points"]
            delta = latest_velocity - previous_velocity
            delta_percentage = round((delta / previous_velocity * 100), 2) if previous_velocity else 0.0
            if delta > 0:
                trend_direction = "up"
            elif delta < 0:
                trend_direction = "down"
        elif len(completed_velocity_rows) == 1:
            latest_velocity = completed_velocity_rows[-1]["completed_story_points"]

        total_committed = sum(h["committed_story_points"] for h in completed_velocity_rows)
        total_completed = sum(h["completed_story_points"] for h in completed_velocity_rows)
        avg_commitment_pct = (
            round(sum(h["commitment_percentage"] for h in completed_velocity_rows) / len(completed_velocity_rows), 2)
            if completed_velocity_rows else 0.0
        )
        avg_completion_pct = (
            round(sum(h["completion_percentage"] for h in completed_velocity_rows) / len(completed_velocity_rows), 2)
            if completed_velocity_rows else 0.0
        )

        return {
            "sprint_summary": {
                "total_sprints": len(history),
                "completed_sprints": len(completed_velocity_rows),
                "cancelled_sprints": len([h for h in history if h["status"] == "cancelled"]),
                "rolling_window": DEFAULT_VELOCITY_ROLLING_WINDOW,
            },
            "velocity_history": history,
            "rolling_average": {
                "window": DEFAULT_VELOCITY_ROLLING_WINDOW,
                "value": rolling_average_value,
                "sprint_count": len(rolling_window),
            },
            "trend": {
                "direction": trend_direction,
                "latest_velocity": latest_velocity,
                "previous_velocity": previous_velocity,
                "delta": delta,
                "delta_percentage": delta_percentage,
            },
            "metrics": {
                "average_velocity": average_velocity,
                "total_committed_story_points": total_committed,
                "total_completed_story_points": total_completed,
                "average_commitment_percentage": avg_commitment_pct,
                "average_completion_percentage": avg_completion_pct,
            },
        }


class SprintHealthCalculator:
    """Computes comprehensive health parameters for a sprint."""
    pass


class SprintReportCalculator:
    """
    Categorizes sprint content issues and computes sprint report metrics.

    Source of Truth (per section):
      - Completed:  IssueStatusHistory + completed_at
      - Incomplete: SprintSnapshot(end) committed_status / live Issue.status
      - Added:      SprintIssueCommitment delta (start vs current/end)
      - Removed:    SprintIssueCommitment delta (start vs current/end)
      - Carry-over: SprintSnapshot(end) + sprint terminal status
      - Scope ΔPts: StoryPointHistory
      - Committed:  SprintSnapshot(start) baseline
      - Completion%: Derived from above

    This calculator performs ZERO database queries.
    """

    def calculate_sprint_report(
        self,
        sprint,
        start_snapshot,
        end_snapshot,
        start_commitments,
        end_commitments,
        issues,
        status_histories,
        story_point_histories,
        activities,
    ) -> dict:
        """
        Args:
            sprint: Sprint model instance.
            start_snapshot: SprintSnapshot of type "start" (or None).
            end_snapshot: SprintSnapshot of type "end" (or None).
            start_commitments: List of SprintIssueCommitment for start snapshot.
            end_commitments: List of SprintIssueCommitment for end snapshot.
            issues: List of Issue records ever associated with the sprint.
            status_histories: List of IssueStatusHistory records (ordered by transitioned_at).
            story_point_histories: List of StoryPointHistory records (ordered by created_at).
            activities: List of IssueActivity (SPRINT_CHANGED) records (ordered by created_at).
        """
        sprint_id = str(sprint.id)
        sprint_name = sprint.name
        sprint_status = sprint.status
        is_terminal = sprint_status in ("completed", "cancelled")

        # Empty sprint guard
        if not sprint.start_date:
            return self._empty_report(sprint_id, sprint_name, sprint_status, sprint)

        # --- Build lookup structures ---
        issues_by_id = {issue.id: issue for issue in issues}

        start_committed_ids = {c.issue_id for c in start_commitments}
        start_commitment_map = {c.issue_id: c for c in start_commitments}

        end_committed_ids = {c.issue_id for c in end_commitments}
        end_commitment_map = {c.issue_id: c for c in end_commitments}

        histories_by_issue = {}
        for h in status_histories:
            histories_by_issue.setdefault(h.issue_id, []).append(h)

        points_by_issue = {}
        for p in story_point_histories:
            points_by_issue.setdefault(p.issue_id, []).append(p)

        activities_by_issue = {}
        for a in activities:
            activities_by_issue.setdefault(a.issue_id, []).append(a)

        # --- Determine current sprint issue set ---
        # For completed sprints with end snapshot: use end snapshot issue set
        # For active sprints: use current issue assignments + start commitments
        if is_terminal and end_commitments:
            current_issue_ids = end_committed_ids | start_committed_ids
        else:
            current_issue_ids = {
                i.id for i in issues if i.sprint_id == sprint.id
            } | start_committed_ids

        # --- Classify issues ---
        completed_list = []
        incomplete_list = []
        added_list = []
        removed_list = []
        carry_over_list = []

        # Track which issues are "in sprint at evaluation time"
        # (not removed)
        in_sprint_ids = set()

        for issue_id in current_issue_ids:
            issue = issues_by_id.get(issue_id)
            if not issue:
                continue

            # Determine if issue was removed from sprint
            was_removed = self._was_removed_from_sprint(
                issue_id, sprint_name, activities_by_issue
            )

            if was_removed and issue_id in start_committed_ids:
                # Issue was committed at start but removed during sprint
                removal_time = self._get_removal_time(
                    issue_id, sprint_name, activities_by_issue
                )
                committed_sp = self._get_committed_points(
                    issue_id, start_commitment_map
                )
                current_sp = self._get_current_points(
                    issue_id, issues_by_id, points_by_issue
                )
                removed_list.append({
                    "issue_id": str(issue_id),
                    "key": issue.key,
                    "title": issue.title,
                    "type": issue.type,
                    "priority": issue.priority,
                    "story_points": current_sp,
                    "committed_story_points": committed_sp,
                    "removed_at": removal_time.isoformat() if removal_time else None,
                })
                continue

            if was_removed:
                # Added then removed — doesn't appear in final sets
                continue

            in_sprint_ids.add(issue_id)

            # Determine if issue was added during sprint
            was_added = issue_id not in start_committed_ids

            # Determine issue status at evaluation time
            status_category = self._get_status_at_evaluation(
                issue_id, sprint, is_terminal, end_commitment_map,
                histories_by_issue, issues_by_id
            )
            status_name = self._get_status_name_at_evaluation(
                issue_id, sprint, is_terminal, end_commitment_map,
                histories_by_issue, issues_by_id
            )
            current_sp = self._get_current_points(
                issue_id, issues_by_id, points_by_issue
            )
            completed_at_val = getattr(issue, 'completed_at', None)

            issue_data = {
                "issue_id": str(issue_id),
                "key": issue.key,
                "title": issue.title,
                "type": issue.type,
                "priority": issue.priority,
                "story_points": current_sp,
                "status_name": status_name,
                "was_added_during_sprint": was_added,
            }

            is_done = (status_category == WorkflowStatusCategory.DONE)

            if is_done:
                issue_data["completed_at"] = (
                    completed_at_val.isoformat() if completed_at_val else None
                )
                completed_list.append(issue_data)
            else:
                incomplete_list.append(issue_data)

            # Added list (regardless of completion status)
            if was_added:
                added_time = self._get_addition_time(
                    issue_id, sprint_name, activities_by_issue
                )
                added_entry = {
                    "issue_id": str(issue_id),
                    "key": issue.key,
                    "title": issue.title,
                    "type": issue.type,
                    "priority": issue.priority,
                    "story_points": current_sp,
                    "status_name": status_name,
                    "added_at": added_time.isoformat() if added_time else None,
                }
                added_list.append(added_entry)

            # Carry-over: only for terminal sprints, incomplete issues
            if is_terminal and not is_done:
                carry_over_list.append({
                    "issue_id": str(issue_id),
                    "key": issue.key,
                    "title": issue.title,
                    "type": issue.type,
                    "priority": issue.priority,
                    "story_points": current_sp,
                    "status_name": status_name,
                })

        # --- Compute summary metrics ---
        shared_calc = SharedDeliveryMetricsCalculator()
        committed_metrics = shared_calc.get_committed_metrics(start_commitments)
        committed_sp = committed_metrics["committed_story_points"]
        committed_issues = committed_metrics["committed_issues"]

        completed_issues_count = len(completed_list)
        completed_sp = sum(i["story_points"] or 0 for i in completed_list)

        incomplete_issues_count = len(incomplete_list)
        incomplete_sp = sum(i["story_points"] or 0 for i in incomplete_list)

        added_issues_count = len(added_list)
        added_sp = sum(i["story_points"] or 0 for i in added_list)

        removed_issues_count = len(removed_list)
        removed_sp = sum(i["committed_story_points"] or 0 for i in removed_list)

        carry_over_issues_count = len(carry_over_list)
        carry_over_sp = sum(i["story_points"] or 0 for i in carry_over_list)

        # --- Scope change (story point level) ---
        sp_scope = self._compute_story_point_scope_change(
            sprint, in_sprint_ids, start_committed_ids, start_commitment_map,
            issues_by_id, points_by_issue
        )

        # Total points added = SP increases + SP of added issues
        total_points_added = sp_scope["points_increased"] + added_sp
        # Total points removed = SP decreases + SP of removed issues
        total_points_removed = sp_scope["points_decreased"] + removed_sp

        # Completion percentages
        total_current_issues = len(in_sprint_ids)
        total_current_sp = completed_sp + incomplete_sp

        completion_pct = round(
            (completed_issues_count / total_current_issues * 100), 2
        ) if total_current_issues > 0 else 0.0

        sp_completion_pct = round(
            (completed_sp / total_current_sp * 100), 2
        ) if total_current_sp > 0 else 0.0

        return {
            "sprint_id": sprint_id,
            "sprint_name": sprint_name,
            "sprint_status": sprint_status,
            "start_date": sprint.start_date.isoformat() if sprint.start_date else None,
            "end_date": sprint.end_date.isoformat() if sprint.end_date else None,

            "summary": {
                "committed_issues": committed_issues,
                "committed_story_points": committed_sp,
                "completed_issues": completed_issues_count,
                "completed_story_points": completed_sp,
                "incomplete_issues": incomplete_issues_count,
                "incomplete_story_points": incomplete_sp,
                "added_issues": added_issues_count,
                "added_story_points": added_sp,
                "removed_issues": removed_issues_count,
                "removed_story_points": removed_sp,
                "carry_over_issues": carry_over_issues_count,
                "carry_over_story_points": carry_over_sp,
                "completion_percentage": completion_pct,
                "story_point_completion_percentage": sp_completion_pct,
            },

            "scope_change": {
                "issues_added": added_issues_count,
                "issues_removed": removed_issues_count,
                "points_added": total_points_added,
                "points_removed": total_points_removed,
                "net_issues": added_issues_count - removed_issues_count,
                "net_story_points": total_points_added - total_points_removed,
            },

            "completed": completed_list,
            "incomplete": incomplete_list,
            "added": added_list,
            "removed": removed_list,
            "carry_over": carry_over_list,
        }

    # ---- Helper methods ----

    def _empty_report(self, sprint_id, sprint_name, sprint_status, sprint):
        """Returns a zeroed-out report for sprints with no start date."""
        empty_summary = {
            "committed_issues": 0, "committed_story_points": 0,
            "completed_issues": 0, "completed_story_points": 0,
            "incomplete_issues": 0, "incomplete_story_points": 0,
            "added_issues": 0, "added_story_points": 0,
            "removed_issues": 0, "removed_story_points": 0,
            "carry_over_issues": 0, "carry_over_story_points": 0,
            "completion_percentage": 0.0,
            "story_point_completion_percentage": 0.0,
        }
        empty_scope = {
            "issues_added": 0, "issues_removed": 0,
            "points_added": 0, "points_removed": 0,
            "net_issues": 0, "net_story_points": 0,
        }
        return {
            "sprint_id": sprint_id,
            "sprint_name": sprint_name,
            "sprint_status": sprint_status,
            "start_date": None,
            "end_date": sprint.end_date.isoformat() if sprint.end_date else None,
            "summary": empty_summary,
            "scope_change": empty_scope,
            "completed": [], "incomplete": [], "added": [],
            "removed": [], "carry_over": [],
        }

    def _was_removed_from_sprint(self, issue_id, sprint_name, activities_by_issue):
        """Check if the issue was removed from this sprint (last activity shows removal)."""
        issue_acts = activities_by_issue.get(issue_id, [])
        last_sprint_state = None
        for act in issue_acts:
            if act.old_value == sprint_name:
                last_sprint_state = "removed"
            elif act.new_value == sprint_name:
                last_sprint_state = "added"
        return last_sprint_state == "removed"

    def _get_removal_time(self, issue_id, sprint_name, activities_by_issue):
        """Get the timestamp when an issue was last removed from the sprint."""
        issue_acts = activities_by_issue.get(issue_id, [])
        removal_time = None
        for act in issue_acts:
            if act.old_value == sprint_name:
                removal_time = act.created_at
        return removal_time

    def _get_addition_time(self, issue_id, sprint_name, activities_by_issue):
        """Get the timestamp when an issue was added to the sprint."""
        issue_acts = activities_by_issue.get(issue_id, [])
        for act in issue_acts:
            if act.new_value == sprint_name:
                return act.created_at
        return None

    def _get_committed_points(self, issue_id, start_commitment_map):
        """Get the committed story points from start snapshot."""
        commitment = start_commitment_map.get(issue_id)
        if commitment:
            return commitment.committed_story_points or 0
        return 0

    def _get_current_points(self, issue_id, issues_by_id, points_by_issue):
        """Get the current story points (latest history or issue fallback)."""
        pt_hist = points_by_issue.get(issue_id, [])
        if pt_hist:
            return pt_hist[-1].new_story_points or 0
        issue = issues_by_id.get(issue_id)
        if issue:
            return issue.story_points or 0
        return 0

    def _get_status_at_evaluation(
        self, issue_id, sprint, is_terminal, end_commitment_map,
        histories_by_issue, issues_by_id
    ):
        """
        Determine the status category at evaluation time.
        Completed sprint: end snapshot committed_status.category
        Active sprint: latest IssueStatusHistory or live Issue.status.category
        """
        if is_terminal and issue_id in end_commitment_map:
            return end_commitment_map[issue_id].committed_status.category

        # Fall back to latest status history
        hist = histories_by_issue.get(issue_id, [])
        if hist:
            return hist[-1].to_status.category

        # Fall back to current issue status
        issue = issues_by_id.get(issue_id)
        if issue:
            return issue.status.category

        return None

    def _get_status_name_at_evaluation(
        self, issue_id, sprint, is_terminal, end_commitment_map,
        histories_by_issue, issues_by_id
    ):
        """Get the status name at evaluation time (for display)."""
        if is_terminal and issue_id in end_commitment_map:
            return end_commitment_map[issue_id].committed_status.name

        hist = histories_by_issue.get(issue_id, [])
        if hist:
            return hist[-1].to_status.name

        issue = issues_by_id.get(issue_id)
        if issue:
            return issue.status.name

        return "Unknown"

    def _compute_story_point_scope_change(
        self, sprint, in_sprint_ids, start_committed_ids,
        start_commitment_map, issues_by_id, points_by_issue
    ):
        """
        Compute story point scope changes from StoryPointHistory.
        Only counts changes that occurred after sprint start date.
        """
        start_dt = datetime.combine(sprint.start_date, time(0, 0, 0), tzinfo=timezone.utc)
        points_increased = 0
        points_decreased = 0

        for issue_id in (in_sprint_ids & start_committed_ids):
            pt_hist = points_by_issue.get(issue_id, [])
            for pt in pt_hist:
                if pt.created_at <= start_dt:
                    continue
                old_pts = pt.previous_story_points or 0
                new_pts = pt.new_story_points or 0
                delta = new_pts - old_pts
                if delta > 0:
                    points_increased += delta
                elif delta < 0:
                    points_decreased += abs(delta)

        return {
            "points_increased": points_increased,
            "points_decreased": points_decreased,
        }


class CycleTimeCalculator:
    """Computes Cycle Time based on status histories."""
    pass


class LeadTimeCalculator:
    """Computes Lead Time from creation to completed."""
    pass


class ThroughputCalculator:
    """Computes counts of completed tasks in windows."""
    pass


class CumulativeFlowCalculator:
    """Computes running totals of workflow categories."""
    pass
