import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'

export type LabelApi = {
  id: string
  name: string
  color: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type CreateLabelPayload = {
  name: string
  color: string
}

export type UpdateLabelPayload = {
  name?: string
  color?: string
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

export async function getProjectLabels(projectId: string): Promise<LabelApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ labels: LabelApi[] }>>(
      `/projects/${projectId}/labels`,
    )
    const labels = data.data?.labels
    return Array.isArray(labels) ? labels : []
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createProjectLabel(
  projectId: string,
  payload: CreateLabelPayload,
): Promise<LabelApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ label: LabelApi }>>(
      `/projects/${projectId}/labels`,
      {
        name: payload.name.trim(),
        color: payload.color.trim(),
      },
    )
    return data.data.label
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateProjectLabel(
  projectId: string,
  labelId: string,
  payload: UpdateLabelPayload,
): Promise<LabelApi> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ label: LabelApi }>>(
      `/projects/${projectId}/labels/${labelId}`,
      payload,
    )
    return data.data.label
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteProjectLabel(projectId: string, labelId: string): Promise<LabelApi> {
  try {
    const { data } = await apiClient.delete<ApiResponse<{ label: LabelApi }>>(
      `/projects/${projectId}/labels/${labelId}`,
    )
    return data.data.label
  } catch (error) {
    throw toApiError(error)
  }
}
