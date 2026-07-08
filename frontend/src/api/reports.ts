import type { ApiResponse } from './types'
import { apiClient } from './client'

export type BurndownDataPoint = {
  date: string
  remaining_points: number | null
  remaining_issues: number | null
  ideal_points: number
  ideal_issues: number
}

export type BurndownReportApi = {
  sprint_id: string | null
  sprint_name: string | null
  committed_points: number
  committed_issues: number
  data_points: BurndownDataPoint[]
}

export async function getBurndownReport(
  projectId: string,
  sprintId?: string,
): Promise<BurndownReportApi> {
  const params: Record<string, string> = {}
  if (sprintId) {
    params.sprint_id = sprintId
  }

  const { data } = await apiClient.get<ApiResponse<{ report: BurndownReportApi }>>(
    `/v1/projects/${projectId}/reports/burndown`,
    { params },
  )
  return data.data.report
}

// ── Sprint Report ──────────────────────────────────────────────────

export type SprintReportIssue = {
  issue_id: string
  key: string
  title: string
  type: string
  priority: string
  story_points: number
  status_name: string
  was_added_during_sprint?: boolean
  completed_at?: string | null
  added_at?: string | null
  committed_story_points?: number
  removed_at?: string | null
}

export type SprintReportSummary = {
  committed_issues: number
  committed_story_points: number
  completed_issues: number
  completed_story_points: number
  incomplete_issues: number
  incomplete_story_points: number
  added_issues: number
  added_story_points: number
  removed_issues: number
  removed_story_points: number
  carry_over_issues: number
  carry_over_story_points: number
  completion_percentage: number
  story_point_completion_percentage: number
}

export type SprintReportScopeChange = {
  issues_added: number
  issues_removed: number
  points_added: number
  points_removed: number
  net_issues: number
  net_story_points: number
}

export type SprintReportApi = {
  sprint_id: string | null
  sprint_name: string | null
  sprint_status: string | null
  start_date: string | null
  end_date: string | null
  summary: SprintReportSummary
  scope_change: SprintReportScopeChange
  completed: SprintReportIssue[]
  incomplete: SprintReportIssue[]
  added: SprintReportIssue[]
  removed: SprintReportIssue[]
  carry_over: SprintReportIssue[]
}

export async function getSprintReport(
  projectId: string,
  sprintId?: string,
): Promise<SprintReportApi> {
  const params: Record<string, string> = {}
  if (sprintId) {
    params.sprint_id = sprintId
  }

  const { data } = await apiClient.get<ApiResponse<{ report: SprintReportApi }>>(
    `/v1/projects/${projectId}/reports/sprint-report`,
    { params },
  )
  return data.data.report
}

