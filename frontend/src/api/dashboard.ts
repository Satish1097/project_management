import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import type { DashboardSummaryApi, DashboardActivityApi } from '@/types/dashboard'

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
    const { data } = await apiClient.get<ApiResponse<DashboardSummaryApi>>(
      '/dashboard/summary',
    )
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getDashboardActivity(): Promise<DashboardActivityApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ activities: DashboardActivityApi[] }>>(
      '/dashboard/activity',
    )
    return data.data.activities
  } catch (error) {
    throw toApiError(error)
  }
}
