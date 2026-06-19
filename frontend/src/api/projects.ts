import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import type { DashboardActivityApi } from '@/types/dashboard'

export type ProjectSummaryApi = {
  id: string
  key: string
  slug: string
  name: string
  status: string
  open_issue_count: number
  active_sprint_id: string | null
  recent_activity?: string
}

export type ProjectDetailApi = {
  id: string
  organization_id: string
  key: string
  slug: string
  name: string
  description: string
  status: string
  visibility: string
  lead_user_id: string | null
  archived_at?: string
}

export type CreateProjectPayload = {
  key: string
  slug: string
  name: string
  description?: string
}

export type UpdateProjectPayload = {
  name?: string
  description?: string
  visibility?: string
  lead_user_id?: string | null
}

export type ProjectActivityPageApi = {
  results: DashboardActivityApi[]
  pagination: {
    count: number
    page: number
    page_size: number
    total_pages: number
    next: string | null
    previous: string | null
  }
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

export async function getProjects(organizationId: string): Promise<ProjectSummaryApi[]> {
  try {
    const response = await apiClient.get<ApiResponse<{ projects: ProjectSummaryApi[] }>>(
      `/organizations/${organizationId}/projects`,
    )
    const projects = response.data.data?.projects
    return Array.isArray(projects) ? projects : []
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getProject(projectId: string): Promise<ProjectDetailApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ project: ProjectDetailApi }>>(
      `/projects/${projectId}`,
    )
    return data.data.project
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createProject(
  organizationId: string,
  payload: CreateProjectPayload,
): Promise<ProjectDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ project: ProjectDetailApi }>>(
      `/organizations/${organizationId}/projects`,
      {
        key: payload.key.trim().toUpperCase(),
        slug: payload.slug.trim().toLowerCase(),
        name: payload.name.trim(),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
      },
    )
    return data.data.project
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<ProjectDetailApi> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ project: ProjectDetailApi }>>(
      `/projects/${projectId}`,
      payload,
    )
    return data.data.project
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getProjectActivityPreview(
  projectId: string,
  limit = 5,
): Promise<DashboardActivityApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ activities: DashboardActivityApi[] }>>(
      `/projects/${projectId}/activity`,
      { params: { limit } },
    )
    return data.data.activities
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getProjectActivity(
  projectId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<ProjectActivityPageApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<ProjectActivityPageApi>>(
      `/projects/${projectId}/activity`,
      {
        params: {
          page: options.page ?? 1,
          page_size: options.pageSize ?? 20,
        },
      },
    )
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}
