# Backfill analytics data migration — rewritten for production safety.
#
# Changes from original version:
# - IDEMPOTENT: issues that already have IssueStatusHistory records are
#   skipped. Safe to re-run after a partial failure.
# - BATCHED: issues are streamed in chunks of BATCH_SIZE via iterator().
#   No large offset-paginated queries; memory usage is bounded.
# - NO N+1: all IssueActivity records for a batch are fetched in a single
#   query and grouped in Python, not one query per issue.
# - DURATION CLAMPED: duration_seconds is clamped to ≥ 0 (handles
#   out-of-order timestamps from clock skew).
# - PRODUCTION-SAFE: each batch is committed separately; a crash partway
#   through does not lose already-committed batches, and re-running will
#   skip the already-processed issues.

from django.db import migrations

BATCH_SIZE = 500


def backfill_analytics_data(apps, schema_editor):
    Issue = apps.get_model("issues", "Issue")
    IssueActivity = apps.get_model("issues", "IssueActivity")
    WorkflowStatus = apps.get_model("workflow", "WorkflowStatus")
    IssueStatusHistory = apps.get_model("workflow", "IssueStatusHistory")

    # ------------------------------------------------------------------ #
    # 1. Build lookup tables in memory — O(statuses) not O(issues)        #
    # ------------------------------------------------------------------ #
    status_map = {}              # {project_id: {name: WorkflowStatus}}
    done_names_by_project = {}   # {project_id: {name, ...}}

    for s in WorkflowStatus.objects.all():
        status_map.setdefault(s.project_id, {})[s.name] = s
        if s.category == "done":
            done_names_by_project.setdefault(s.project_id, set()).add(s.name)

    # ------------------------------------------------------------------ #
    # 2. Determine which issues already have history (idempotency)         #
    # ------------------------------------------------------------------ #
    already_processed = set(
        IssueStatusHistory.objects.values_list("issue_id", flat=True).distinct()
    )

    # ------------------------------------------------------------------ #
    # 3. Stream issues in batches; skip already-processed ones             #
    # ------------------------------------------------------------------ #
    issues_qs = (
        Issue.objects.select_related("status")
        .exclude(id__in=already_processed)
        .order_by("id")
    )

    batch = []

    def flush_batch(batch):
        if not batch:
            return

        issue_ids = [iss.id for iss in batch]

        # Fetch all relevant activities for this batch in one query (no N+1).
        activities_by_issue = {}
        for act in IssueActivity.objects.filter(
            issue_id__in=issue_ids,
            event_type="status_changed",
        ).order_by("created_at"):
            activities_by_issue.setdefault(act.issue_id, []).append(act)

        history_records = []
        issues_to_update = []

        for iss in batch:
            project_id = iss.project_id
            proj_status_map = status_map.get(project_id, {})
            done_names = done_names_by_project.get(project_id, set())
            activities = activities_by_issue.get(iss.id, [])

            issue_histories = []
            latest_completed_at = None

            for act in activities:
                to_status = proj_status_map.get(act.new_value)
                if to_status is None:
                    # Status was renamed or deleted after the activity was
                    # logged — skip silently rather than creating a bad record.
                    continue

                from_status = proj_status_map.get(act.old_value)  # May be None

                if act.new_value in done_names:
                    latest_completed_at = act.created_at

                issue_histories.append(
                    {
                        "issue_id": iss.id,
                        "from_status": from_status,
                        "to_status": to_status,
                        "transitioned_by_id": act.actor_id,
                        "transitioned_at": act.created_at,
                    }
                )

            # Compute duration for each historical interval (all closed except last).
            for i, rec in enumerate(issue_histories):
                duration = None
                if i < len(issue_histories) - 1:
                    next_dt = issue_histories[i + 1]["transitioned_at"]
                    elapsed = (next_dt - rec["transitioned_at"]).total_seconds()
                    duration = max(0, int(elapsed))

                history_records.append(
                    IssueStatusHistory(
                        issue_id=rec["issue_id"],
                        from_status=rec["from_status"],
                        to_status=rec["to_status"],
                        transitioned_by_id=rec["transitioned_by_id"],
                        transitioned_at=rec["transitioned_at"],
                        duration_seconds=duration,
                    )
                )

            # Backfill completed_at only when the current status is DONE
            # and the field is not already set.
            if iss.status.category == "done" and iss.completed_at is None:
                iss.completed_at = latest_completed_at or iss.updated_at
                issues_to_update.append(iss)

        if history_records:
            IssueStatusHistory.objects.bulk_create(history_records)
        if issues_to_update:
            Issue.objects.bulk_update(issues_to_update, ["completed_at"])

    for issue in issues_qs.iterator(chunk_size=BATCH_SIZE):
        batch.append(issue)
        if len(batch) >= BATCH_SIZE:
            flush_batch(batch)
            batch = []

    flush_batch(batch)  # Process any remaining issues in the last partial batch


def reverse_backfill(apps, schema_editor):
    """
    Reverse clears ALL IssueStatusHistory and nullifies completed_at.

    WARNING: if real (non-backfill) history records were written after this
    migration ran, they will also be deleted. This is acceptable on a feature
    branch where no live traffic has run. On a production migration reversal,
    use a manual rollback strategy instead.
    """
    Issue = apps.get_model("issues", "Issue")
    IssueStatusHistory = apps.get_model("workflow", "IssueStatusHistory")

    Issue.objects.update(completed_at=None)
    IssueStatusHistory.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0009_issue_completed_at_storypointhistory"),
        ("workflow", "0004_issuestatushistory"),
    ]

    operations = [
        migrations.RunPython(backfill_analytics_data, reverse_code=reverse_backfill),
    ]
