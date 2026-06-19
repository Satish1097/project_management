import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import type {
  DashboardSummaryApi,
  DashboardSummaryResponseApi,
  DashboardActivityApi,
} from '@/types/dashboard'

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const response = (error as { response: { data?: ApiResponse; status?: number } }).response
    const data = response.data
    const message = data?.message || 'Request failed.'
    return new ApiError(message, data?.errors, response.status)
  }

  return new ApiError('Network error. Please try again.')
}

export async function getDashboardSummary(): Promise<DashboardSummaryApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ summary: DashboardSummaryResponseApi }>>(
      '/dashboard/summary',
    )
    const summary = data.data.summary
    return {
      visible_project_count: summary.total_visible_projects,
      active_sprint_count: summary.active_sprints,
      open_issue_count: summary.open_issues,
      assigned_to_me_count: summary.assigned_to_me,
      overdue_issue_count: summary.overdue_issues,
      unread_notification_count: summary.unread_notification_count,
    }
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getDashboardActivity(limit = 5): Promise<DashboardActivityApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ activities: DashboardActivityApi[] }>>(
      '/dashboard/activity',
      { params: { limit } },
    )
    return data.data.activities
  } catch (error) {
    throw toApiError(error)
  }
}
