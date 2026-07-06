import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'

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

export async function requestPasswordReset(email: string): Promise<string> {
  try {
    const { data } = await apiClient.post<ApiResponse>('/auth/password/forgot', { email })
    return data.message
  } catch (error) {
    throw toApiError(error)
  }
}

export async function resetPassword(
  uid: string,
  token: string,
  password: string,
): Promise<string> {
  try {
    const { data } = await apiClient.post<ApiResponse>('/auth/password/reset', {
      uid,
      token,
      password,
    })
    return data.message
  } catch (error) {
    throw toApiError(error)
  }
}
