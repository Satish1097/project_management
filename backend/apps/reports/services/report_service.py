import logging
from uuid import UUID
from django.core.cache import cache
from apps.reports.selectors import (
    get_sprint_data_for_burndown,
    get_sprint_data_for_sprint_report,
    get_velocity_data_for_sprints,
)
from apps.reports.services.calculators import (
    BurndownCalculator,
    SprintReportCalculator,
    VelocityCalculator,
)
from apps.sprints.selectors import get_project_sprints

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self):
        self.burndown_calculator = BurndownCalculator()
        self.sprint_report_calculator = SprintReportCalculator()
        self.velocity_calculator = VelocityCalculator()

    def get_sprint_burndown(self, project_id: UUID, sprint_id: UUID) -> dict | None:
        """
        Retrieves the sprint burndown metrics, checking Redis cache first.
        If cache is empty, queries the DB, calculates, caches, and returns.
        """
        cache_key = f"reports:proj:{project_id}:burndown:{sprint_id}"

        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return cached_data
        except Exception:
            logger.exception("Failed to read from reports cache.")

        # Fetch data via selector
        sprint_data = get_sprint_data_for_burndown(sprint_id)
        if sprint_data is None:
            return None

        sprint = sprint_data["sprint"]
        if sprint.project_id != project_id:
            return None

        # Compute
        report_data = self.burndown_calculator.calculate_burndown(
            sprint=sprint,
            start_snapshot=sprint_data["start_snapshot"],
            commitments=sprint_data["commitments"],
            issues=sprint_data["issues"],
            status_histories=sprint_data["status_histories"],
            story_point_histories=sprint_data["story_point_histories"],
            activities=sprint_data["activities"]
        )

        # Cache: 1 hour for active/planned, 30 days for completed
        ttl = 3600
        if sprint.status == "completed":
            ttl = 2592000

        try:
            cache.set(cache_key, report_data, timeout=ttl)
        except Exception:
            logger.exception("Failed to write to reports cache.")

        return report_data

    def get_sprint_report(self, project_id: UUID, sprint_id: UUID) -> dict | None:
        """
        Retrieves the sprint report metrics, checking Redis cache first.
        Cache key: reports:proj:{pid}:sprint-report:{sid}
        TTL: 1 hour for active/planned, 30 days for completed/cancelled.
        """
        cache_key = f"reports:proj:{project_id}:sprint-report:{sprint_id}"

        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return cached_data
        except Exception:
            logger.exception("Failed to read from reports cache.")

        # Fetch data via selector
        sprint_data = get_sprint_data_for_sprint_report(sprint_id)
        if sprint_data is None:
            return None

        sprint = sprint_data["sprint"]
        if sprint.project_id != project_id:
            return None

        # Compute via stateless calculator
        report_data = self.sprint_report_calculator.calculate_sprint_report(
            sprint=sprint,
            start_snapshot=sprint_data["start_snapshot"],
            end_snapshot=sprint_data["end_snapshot"],
            start_commitments=sprint_data["start_commitments"],
            end_commitments=sprint_data["end_commitments"],
            issues=sprint_data["issues"],
            status_histories=sprint_data["status_histories"],
            story_point_histories=sprint_data["story_point_histories"],
            activities=sprint_data["activities"],
        )

        # Cache: 1 hour for active/planned, 30 days for completed/cancelled
        ttl = 3600
        if sprint.status in ("completed", "cancelled"):
            ttl = 2592000

        try:
            cache.set(cache_key, report_data, timeout=ttl)
        except Exception:
            logger.exception("Failed to write to reports cache.")

        return report_data

    def get_velocity_report(self, project_id: UUID) -> dict | None:
        """
        Retrieves the velocity report metrics for a project.
        Cache key: reports:proj:{pid}:velocity
        TTL: 1 hour
        """
        cache_key = f"reports:proj:{project_id}:velocity"

        try:
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return cached_data
        except Exception:
            logger.exception("Failed to read from reports cache.")

        # 1. Fetch relevant sprints (all but planned), sorted oldest to newest
        sprints = list(get_project_sprints(project_id).exclude(status="planned"))
        if not sprints:
            return None
        sprints.reverse()

        # 2. Bulk fetch all snapshot data for these sprints
        sprints_data = get_velocity_data_for_sprints(sprints)

        # 3. Compute via stateless calculator
        report_data = self.velocity_calculator.calculate_velocity(sprints_data)

        # 4. Cache for 1 hour
        try:
            cache.set(cache_key, report_data, timeout=3600)
        except Exception:
            logger.exception("Failed to write to reports cache.")

        return report_data


report_service = ReportService()

