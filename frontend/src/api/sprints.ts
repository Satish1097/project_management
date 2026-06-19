import type { KanbanBoardApi } from './issues'
import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import type { DashboardActivityApi } from '@/types/dashboard'

export type SprintSummaryApi = {
  id: string
  project_id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
  capacity_points?: number | null
  issue_count?: number
  completed_issue_count?: number
}

export type SprintDetailApi = SprintSummaryApi & {
  goal: string
  started_at: string | null
  completed_at: string | null
}

export type CreateSprintPayload = {
  name: string
  goal?: string
  start_date?: string | null
  end_date?: string | null
  capacity_points?: number | null
}

export type UpdateSprintPayload = {
  name?: string
  goal?: string
  start_date?: string | null
  end_date?: string | null
  capacity_points?: number | null
}

export type CompleteSprintPayload = {
  carry_forward_to_sprint_id?: string
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

export async function getProjectSprints(projectId: string): Promise<SprintSummaryApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ sprints: SprintSummaryApi[] }>>(
      `/projects/${projectId}/sprints`,
    )
    return data.data.sprints
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getSprint(
  projectId: string,
  sprintId: string,
): Promise<SprintDetailApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints/${sprintId}`,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getSprintActivity(
  projectId: string,
  sprintId: string,
): Promise<DashboardActivityApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ activities: DashboardActivityApi[] }>>(
      `/projects/${projectId}/sprints/${sprintId}/activity`,
    )
    return data.data.activities
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getSprintBoard(
  projectId: string,
  sprintId: string,
): Promise<KanbanBoardApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ board: KanbanBoardApi }>>(
      `/projects/${projectId}/sprints/${sprintId}/board`,
    )
    return data.data.board
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createSprint(
  projectId: string,
  payload: CreateSprintPayload,
): Promise<SprintDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints`,
      payload,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateSprint(
  projectId: string,
  sprintId: string,
  payload: UpdateSprintPayload,
): Promise<SprintDetailApi> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints/${sprintId}`,
      payload,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function startSprint(
  projectId: string,
  sprintId: string,
): Promise<SprintDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints/${sprintId}/start`,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function pauseSprint(
  projectId: string,
  sprintId: string,
): Promise<SprintDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints/${sprintId}/pause`,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function resumeSprint(
  projectId: string,
  sprintId: string,
): Promise<SprintDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints/${sprintId}/resume`,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function completeSprint(
  projectId: string,
  sprintId: string,
  payload: CompleteSprintPayload = {},
): Promise<SprintDetailApi> {
  try {
    const body = payload.carry_forward_to_sprint_id
      ? {
          move_incomplete_to: 'sprint' as const,
          target_sprint_id: payload.carry_forward_to_sprint_id,
        }
      : { move_incomplete_to: 'backlog' as const }

    const { data } = await apiClient.post<ApiResponse<{ sprint: SprintDetailApi }>>(
      `/projects/${projectId}/sprints/${sprintId}/complete`,
      body,
    )
    return data.data.sprint
  } catch (error) {
    throw toApiError(error)
  }
}

export async function moveIssuesToSprint(
  sprintId: string,
  issueIds: string[],
): Promise<number> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ moved_count: number }>>(
      `/sprints/${sprintId}/move-issues`,
      {
        issue_ids: issueIds,
        sprint_id: sprintId,
      },
    )
    return data.data.moved_count
  } catch (error) {
    throw toApiError(error)
  }
}

export async function moveIssuesToBacklog(
  fromSprintId: string,
  issueIds: string[],
): Promise<number> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ moved_count: number }>>(
      `/sprints/${fromSprintId}/move-issues`,
      { issue_ids: issueIds },
    )
    return data.data.moved_count
  } catch (error) {
    throw toApiError(error)
  }
}
