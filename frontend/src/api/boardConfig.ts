import { apiClient } from './client'
import type { ApiResponse } from './types'
import { ApiError } from './types'

export type KanbanBoardColumnConfigApi = {
  status_id: string
  status_name: string
  status_slug: string
  wip_limit: number | null
  is_enabled: boolean
  display_order: number
}

export type KanbanBoardConfigApi = {
  columns: KanbanBoardColumnConfigApi[]
}

export type KanbanBoardColumnConfigPayload = {
  status_id: string
  wip_limit?: number | null
  is_enabled?: boolean
  display_order?: number
}

export type KanbanBoardConfigUpdatePayload = {
  columns: KanbanBoardColumnConfigPayload[]
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

export async function getProjectBoardConfig(
  projectId: string,
): Promise<KanbanBoardConfigApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ board_config: KanbanBoardConfigApi }>>(
      `/projects/${projectId}/board-config`,
    )
    return data.data.board_config
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateProjectBoardConfig(
  projectId: string,
  payload: KanbanBoardConfigUpdatePayload,
): Promise<KanbanBoardConfigApi> {
  try {
    const { data } = await apiClient.put<ApiResponse<{ board_config: KanbanBoardConfigApi }>>(
      `/projects/${projectId}/board-config`,
      payload,
    )
    return data.data.board_config
  } catch (error) {
    throw toApiError(error)
  }
}
