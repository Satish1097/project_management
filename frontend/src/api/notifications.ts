import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'

export type NotificationApi = {
  id: string
  actor: string | null
  event_type: string
  title: string
  message: string
  is_read: boolean
  related_issue: string | null
  created_at: string
}

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

export async function getNotifications(): Promise<NotificationApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ notifications: NotificationApi[] }>>(
      '/notifications',
    )
    return data.data.notifications
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count',
    )
    return data.data.count
  } catch (error) {
    throw toApiError(error)
  }
}

export async function markNotificationRead(notificationId: string): Promise<NotificationApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ notification: NotificationApi }>>(
      `/notifications/${notificationId}/read`,
    )
    return data.data.notification
  } catch (error) {
    throw toApiError(error)
  }
}

export async function markAllNotificationsRead(): Promise<number> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ updated: number }>>(
      '/notifications/read-all',
    )
    return data.data.updated
  } catch (error) {
    throw toApiError(error)
  }
}
