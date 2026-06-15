import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import { getWorkflow, statusIdForSlug } from './workflow'

export type IssueSummaryApi = {
  id: string
  key: string
  title: string
  issue_type: string
  priority: string
  status_slug: string
  position: string
  assignee_id: string | null
  sprint_id: string | null
}

export type IssueDetailApi = IssueSummaryApi & {
  description: string
  status: {
    id?: string
    slug: string
    name?: string
  }
  reporter: { id: string; display_name?: string } | null
  assignee: { id: string; display_name?: string } | null
  parent_issue_id: string | null
  story_points: number | null
  due_date: string | null
  labels: string[]
  created_at: string
  updated_at: string
}

export type CreateIssuePayload = {
  title: string
  description?: string
  priority?: string
  issue_type?: string
  story_points?: number | null
  labels?: string[]
  parent_issue_id?: string | null
  sprint_id?: string | null
  assignee_id?: string | null
}

export type UpdateIssuePayload = {
  title?: string
  description?: string
  priority?: string
  story_points?: number | null
  due_date?: string | null
  labels?: string[]
}

export type KanbanBoardColumnApi = {
  status_slug: string
  status_name: string
  issues: IssueSummaryApi[]
}

export type KanbanBoardApi = {
  project_id: string
  columns: KanbanBoardColumnApi[]
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

export async function getBacklog(projectId: string): Promise<IssueSummaryApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ issues: IssueSummaryApi[] }>>(
      `/projects/${projectId}/backlog`,
    )
    return data.data.issues
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getIssue(issueId: string): Promise<IssueDetailApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ issue: IssueDetailApi }>>(
      `/issues/${issueId}`,
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createIssue(
  projectId: string,
  payload: CreateIssuePayload,
): Promise<IssueDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ issue: IssueDetailApi }>>(
      `/projects/${projectId}/issues`,
      payload,
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateIssue(
  issueId: string,
  payload: UpdateIssuePayload,
): Promise<IssueDetailApi> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ issue: IssueDetailApi }>>(
      `/issues/${issueId}`,
      payload,
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function assignIssue(
  issueId: string,
  assigneeId: string | null,
): Promise<IssueDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ issue: IssueDetailApi }>>(
      `/issues/${issueId}/assign`,
      { assignee_id: assigneeId },
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function moveIssueToSprint(
  issueId: string,
  sprintId: string | null,
): Promise<IssueDetailApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ issue: IssueDetailApi }>>(
      `/issues/${issueId}/move-sprint`,
      { sprint_id: sprintId },
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getKanban(projectId: string): Promise<KanbanBoardApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ board: KanbanBoardApi }>>(
      `/projects/${projectId}/kanban`,
    )
    return data.data.board
  } catch (error) {
    throw toApiError(error)
  }
}

export async function transitionIssue(
  issueId: string,
  transitionSlug: string,
  projectId: string,
): Promise<IssueDetailApi> {
  try {
    const workflow = await getWorkflow(projectId)
    const targetStatusId = statusIdForSlug(workflow, transitionSlug)
    if (!targetStatusId) {
      throw new ApiError(`Unknown status "${transitionSlug}".`)
    }

    const { data } = await apiClient.post<ApiResponse<{ issue: IssueDetailApi }>>(
      `/issues/${issueId}/transition`,
      { target_status_id: targetStatusId },
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}
