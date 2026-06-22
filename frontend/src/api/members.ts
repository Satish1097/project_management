import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'

export type ProjectMemberRecord = {
  user_id: string
  project_id: string
  role: string
  email?: string
  display_name?: string
  joined_at?: string
}

export type ProjectInviteResult = {
  status: 'added_existing_user' | 'invite_sent'
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

export async function getProjectMembers(projectId: string): Promise<ProjectMemberRecord[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ members: ProjectMemberRecord[] }>>(
      `/projects/${projectId}/members`,
    )
    return data.data?.members ?? []
  } catch (error) {
    throw toApiError(error)
  }
}

export async function inviteProjectMember(
  projectId: string,
  payload: { email: string; role: string },
): Promise<ProjectInviteResult> {
  try {
    const { data } = await apiClient.post<ApiResponse<ProjectInviteResult>>(
      `/projects/${projectId}/invite`,
      payload,
    )
    if (!data.data?.status) {
      throw new ApiError('Unexpected invite response.')
    }
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateProjectMemberRole(
  projectId: string,
  userId: string,
  role: string,
): Promise<ProjectMemberRecord> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ member: ProjectMemberRecord }>>(
      `/projects/${projectId}/members/${userId}`,
      { role },
    )
    if (!data.data?.member) {
      throw new ApiError('Unexpected member update response.')
    }
    return data.data.member
  } catch (error) {
    throw toApiError(error)
  }
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<void> {
  try {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`)
  } catch (error) {
    throw toApiError(error)
  }
}
