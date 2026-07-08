from uuid import UUID
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.foundation.responses import success_response, error_response
from apps.permissions.drf_permissions import Authenticated, CanViewProject
from apps.projects.services.project_service import require_scrum_project
from apps.sprints.selectors import get_active_sprint, get_project_sprints
from apps.reports.services.report_service import report_service
from apps.reports.services.calculators import DEFAULT_VELOCITY_ROLLING_WINDOW
from apps.projects.selectors import select_project_by_id
from apps.projects.exceptions import ProjectNotFoundError


class SprintBurndownReportView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    def get(self, request, project_id: UUID):
        """
        GET /api/v1/projects/{projectId}/reports/burndown
        Returns raw domain metrics for the burndown of the given sprint.
        """
        project = select_project_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")

        # Enforce Scrum project methodology
        require_scrum_project(project_id)

        sprint_id_str = request.query_params.get("sprint_id")
        if sprint_id_str:
            try:
                sprint_id = UUID(sprint_id_str)
            except ValueError:
                return error_response(message="Invalid sprint_id format.")
        else:
            # Default to active sprint
            active_sprint = get_active_sprint(project_id)
            if active_sprint:
                sprint_id = active_sprint.id
            else:
                # Fallback to the most recent sprint
                sprints = get_project_sprints(project_id)
                if sprints.exists():
                    sprint_id = sprints.first().id
                else:
                    # Return empty burndown DTO when no sprints exist
                    return success_response(data={
                        "report": {
                            "sprint_id": None,
                            "sprint_name": None,
                            "committed_points": 0,
                            "committed_issues": 0,
                            "data_points": []
                        }
                    })

        # Fetch report data
        report_data = report_service.get_sprint_burndown(project_id, sprint_id)
        if report_data is None:
            return error_response(message="Sprint not found in this project.", status=404)

        return success_response(data={"report": report_data})


class SprintReportView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    def get(self, request, project_id: UUID):
        """
        GET /api/v1/projects/{projectId}/reports/sprint-report
        Returns raw domain metrics for the sprint report.
        """
        project = select_project_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")

        # Enforce Scrum project methodology
        require_scrum_project(project_id)

        sprint_id_str = request.query_params.get("sprint_id")
        if sprint_id_str:
            try:
                sprint_id = UUID(sprint_id_str)
            except ValueError:
                return error_response(message="Invalid sprint_id format.")
        else:
            # Default to active sprint
            active_sprint = get_active_sprint(project_id)
            if active_sprint:
                sprint_id = active_sprint.id
            else:
                # Fallback to the most recent sprint
                sprints = get_project_sprints(project_id)
                if sprints.exists():
                    sprint_id = sprints.first().id
                else:
                    # Return empty sprint report DTO
                    return success_response(data={
                        "report": {
                            "sprint_id": None,
                            "sprint_name": None,
                            "sprint_status": None,
                            "start_date": None,
                            "end_date": None,
                            "summary": {
                                "committed_issues": 0,
                                "committed_story_points": 0,
                                "completed_issues": 0,
                                "completed_story_points": 0,
                                "incomplete_issues": 0,
                                "incomplete_story_points": 0,
                                "added_issues": 0,
                                "added_story_points": 0,
                                "removed_issues": 0,
                                "removed_story_points": 0,
                                "carry_over_issues": 0,
                                "carry_over_story_points": 0,
                                "completion_percentage": 0.0,
                                "story_point_completion_percentage": 0.0,
                            },
                            "scope_change": {
                                "issues_added": 0,
                                "issues_removed": 0,
                                "points_added": 0,
                                "points_removed": 0,
                                "net_issues": 0,
                                "net_story_points": 0,
                            },
                            "completed": [],
                            "incomplete": [],
                            "added": [],
                            "removed": [],
                            "carry_over": [],
                        }
                    })

        # Fetch report data
        report_data = report_service.get_sprint_report(project_id, sprint_id)
        if report_data is None:
            return error_response(message="Sprint not found in this project.", status=404)

        return success_response(data={"report": report_data})


class VelocityReportView(APIView):
    permission_classes = [Authenticated, CanViewProject]

    def get(self, request, project_id: UUID):
        """
        GET /api/v1/projects/{projectId}/reports/velocity
        Returns raw domain metrics for the sprint velocity.
        """
        project = select_project_by_id(project_id)
        if not project:
            raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")

        # Enforce Scrum project methodology
        require_scrum_project(project_id)

        # Fetch report data
        report_data = report_service.get_velocity_report(project_id)
        if report_data is None:
            # Return empty if no sprints
            report_data = {
                "sprint_summary": {
                    "total_sprints": 0,
                    "completed_sprints": 0,
                    "cancelled_sprints": 0,
                    "rolling_window": DEFAULT_VELOCITY_ROLLING_WINDOW,
                },
                "velocity_history": [],
                "rolling_average": {
                    "window": DEFAULT_VELOCITY_ROLLING_WINDOW,
                    "value": 0.0,
                    "sprint_count": 0,
                },
                "trend": {
                    "direction": "stable",
                    "latest_velocity": None,
                    "previous_velocity": None,
                    "delta": 0,
                    "delta_percentage": 0.0,
                },
                "metrics": {
                    "average_velocity": 0.0,
                    "total_committed_story_points": 0,
                    "total_completed_story_points": 0,
                    "average_commitment_percentage": 0.0,
                    "average_completion_percentage": 0.0,
                },
            }

        return success_response(data={"report": report_data})
