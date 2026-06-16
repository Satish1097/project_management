import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import { getWorkflow, statusIdForSlug } from './workflow'

export type IssueLabelApi = {
  id: string
  name: string
  color: string
  is_archived?: boolean
}

export type IssueStatusApi = {
  id: string
  slug: string
  name: string
}

export type IssueApi = {
  id: string
  project: string
  key: string
  title: string
  description: string
  type: string
  priority: string
  status: IssueStatusApi
  sprint: string | null
  labels: IssueLabelApi[]
  assignee: string | null
  reporter: string
  due_date: string | null
  estimate_hours: string | null
  story_points: number | null
  created_at: string
  updated_at: string
}

/** @deprecated Use IssueApi */
export type IssueSummaryApi = IssueApi

/** @deprecated Use IssueApi */
export type IssueDetailApi = IssueApi

export type IssueListFilters = {
  sprint?: string | null
  search?: string
  assignee?: string
  priority?: string
  status?: string
}

export type CreateIssuePayload = {
  title: string
  description?: string
  type?: string
  priority?: string
  sprint?: string | null
  assignee?: string | null
  labels?: string[]
  due_date?: string | null
  estimate_hours?: number | null
  story_points?: number | null
}

export type UpdateIssuePayload = {
  title?: string
  description?: string
  type?: string
  priority?: string
  sprint?: string | null
  assignee?: string | null
  labels?: string[]
  due_date?: string | null
  estimate_hours?: number | null
  story_points?: number | null
}

export type KanbanBoardColumnApi = {
  status_slug: string
  status_name: string
  issues: IssueApi[]
}

export type KanbanBoardApi = {
  project_id: string
  columns: KanbanBoardColumnApi[]
}

function normalizeIssueType(type?: string): CreateIssuePayload['type'] {
  if (!type) return type
  if (type === 'task' || type === 'bug' || type === 'story' || type === 'epic') {
    return type
  }
  return 'task'
}

function normalizeIssuePriority(priority?: string): CreateIssuePayload['priority'] {
  if (!priority) return priority
  if (
    priority === 'low' ||
    priority === 'medium' ||
    priority === 'high' ||
    priority === 'critical'
  ) {
    return priority
  }
  if (priority === 'lowest') return 'low'
  if (priority === 'blocker') return 'critical'
  return 'medium'
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

function buildIssueQueryParams(
  projectId: string,
  filters: IssueListFilters = {},
): Record<string, string> {
  const params: Record<string, string> = { project: projectId }

  if (filters.sprint === null) {
    params.sprint = 'null'
  } else if (filters.sprint) {
    params.sprint = filters.sprint
  }
  if (filters.search) params.search = filters.search
  if (filters.assignee) params.assignee = filters.assignee
  if (filters.priority) params.priority = filters.priority
  if (filters.status) params.status = filters.status

  return params
}

export async function listIssues(
  projectId: string,
  filters: IssueListFilters = {},
): Promise<IssueApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ issues: IssueApi[] }>>('/issues', {
      params: buildIssueQueryParams(projectId, filters),
    })
    return data.data.issues
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getBacklog(projectId: string): Promise<IssueApi[]> {
  return listIssues(projectId, { sprint: null })
}

export async function getIssue(issueId: string): Promise<IssueApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ issue: IssueApi }>>(
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
): Promise<IssueApi> {
  try {
    const normalizedPayload: CreateIssuePayload = {
      ...payload,
      type: normalizeIssueType(payload.type),
      priority: normalizeIssuePriority(payload.priority),
    }
    const { data } = await apiClient.post<ApiResponse<{ issue: IssueApi }>>(
      '/issues',
      normalizedPayload,
      { params: { project: projectId } },
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateIssue(
  issueId: string,
  payload: UpdateIssuePayload,
): Promise<IssueApi> {
  try {
    const normalizedPayload: UpdateIssuePayload = {
      ...payload,
      type: normalizeIssueType(payload.type),
      priority: normalizeIssuePriority(payload.priority),
    }
    const { data } = await apiClient.patch<ApiResponse<{ issue: IssueApi }>>(
      `/issues/${issueId}`,
      normalizedPayload,
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function assignIssueSprint(
  issueId: string,
  sprintId: string | null,
): Promise<IssueApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ issue: IssueApi }>>(
      `/issues/${issueId}/assign-sprint`,
      { sprint_id: sprintId },
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}

export async function bulkAssignSprint(
  issueIds: string[],
  sprintId: string | null,
): Promise<number> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ updated: number }>>(
      '/issues/bulk/assign-sprint',
      { issue_ids: issueIds, sprint_id: sprintId },
    )
    return data.data.updated
  } catch (error) {
    throw toApiError(error)
  }
}

/** @deprecated Use assignIssueSprint */
export async function assignIssue(
  issueId: string,
  assigneeId: string | null,
): Promise<IssueApi> {
  return updateIssue(issueId, { assignee: assigneeId })
}

/** @deprecated Use assignIssueSprint */
export async function moveIssueToSprint(
  issueId: string,
  sprintId: string | null,
): Promise<IssueApi> {
  return assignIssueSprint(issueId, sprintId)
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
  toStatusId: string,
  projectId?: string,
): Promise<IssueApi> {
  try {
    let targetStatusId = toStatusId
    if (projectId) {
      const workflow = await getWorkflow(projectId)
      const statusId = statusIdForSlug(workflow, toStatusId)
      if (!statusId) {
        throw new ApiError(`Unknown status "${toStatusId}".`)
      }
      targetStatusId = statusId
    }

    const { data } = await apiClient.post<ApiResponse<{ issue: IssueApi }>>(
      `/issues/${issueId}/transition`,
      { to_status_id: targetStatusId },
    )
    return data.data.issue
  } catch (error) {
    throw toApiError(error)
  }
}
