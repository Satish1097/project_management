import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'

export type OrganizationDetail = {
  id: string
  name: string
  slug: string
  owner_id: string
  is_active: boolean
}

export type CreateOrganizationPayload = {
  name: string
  slug: string
  owner_user_id: string
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

export async function createOrganization(
  payload: CreateOrganizationPayload,
): Promise<OrganizationDetail> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ organization: OrganizationDetail }>>(
      '/organizations',
      payload,
    )
    return data.data.organization
  } catch (error) {
    throw toApiError(error)
  }
}
