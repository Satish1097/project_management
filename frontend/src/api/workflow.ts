import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'

export type WorkflowStatusApi = {
  id: string
  slug: string
  name: string
  category: string
  order: number
}

export type WorkflowTransitionApi = {
  id: string
  from_status_slug: string
  to_status_slug: string
  name: string
}

export type WorkflowConfigApi = {
  project_id: string
  statuses: WorkflowStatusApi[]
  transitions: WorkflowTransitionApi[]
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

export async function getWorkflow(projectId: string): Promise<WorkflowConfigApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ workflow: WorkflowConfigApi }>>(
      `/projects/${projectId}/workflow`,
    )
    return data.data.workflow
  } catch (error) {
    throw toApiError(error)
  }
}

export function statusIdForSlug(
  workflow: WorkflowConfigApi,
  statusSlug: string,
): string | undefined {
  return workflow.statuses.find((status) => status.slug === statusSlug)?.id
}
