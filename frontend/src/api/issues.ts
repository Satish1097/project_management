import type { ApiResponse } from './types'
import { ApiError } from './types'
import { apiClient } from './client'
import { DEFAULT_KANBAN_PAGE_SIZE } from '@/constants/kanban'
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

export type IssueSprintRefApi = {
  id: string
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
  sprint: string | IssueSprintRefApi | null
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

export type KanbanSprintApi = {
  id: string
  project_id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
  capacity_points?: number | null
}

export type KanbanWorkflowStatusApi = IssueStatusApi & {
  category?: string
  color?: string
  order?: number
  is_default?: boolean
  is_terminal?: boolean
}

export type IssueListFilters = {
  sprint?: string | null
  search?: string
  assignee?: string
  priority?: string
  status?: string
  label?: string[]
  sort?: string
}

export type IssueListPaginationApi = {
  count: number
  next: string | null
  previous: string | null
  results: IssueApi[]
}

export type IssueListQuery = IssueListFilters & {
  page?: number
  page_size?: number
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
  parent_issue?: string | null
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
  id?: string
  status_id?: string
  status_slug: string
  status_name?: string
  name?: string
  count: number
  status?: KanbanWorkflowStatusApi
  /** @deprecated Issues are loaded per-column via board column endpoint */
  issues?: IssueApi[]
}

export type KanbanColumnIssuesApi = {
  page: number
  page_size: number
  total: number
  has_next: boolean
  issues: IssueApi[]
}

export type BoardColumnQuery = {
  page?: number
  page_size?: number
  assignee?: string
  status?: string
  priority?: string
  label?: string[]
  labels?: string
  search?: string
  dueDate?: string
}

export type KanbanBoardAssigneeFilterApi = {
  id: string
  display_name: string
  avatar: string | null
}

export type KanbanBoardStatusFilterApi = {
  id: string
  slug: string
  name: string
  category?: string | null
  color?: string | null
  order?: number
  is_default?: boolean
}

export type KanbanBoardLabelFilterApi = {
  id: string
  name: string
  color: string
}

export type KanbanBoardPriorityFilterApi = {
  id: string
  label: string
}

export type KanbanBoardFiltersApi = {
  assignees: KanbanBoardAssigneeFilterApi[]
  statuses: KanbanBoardStatusFilterApi[]
  labels: KanbanBoardLabelFilterApi[]
  priorities: KanbanBoardPriorityFilterApi[]
}

export type KanbanBoardApi = {
  project_id: string
  selected_sprint?: KanbanSprintApi | null
  sprint?: KanbanSprintApi | null
  workflow_columns?: KanbanWorkflowStatusApi[]
  /** @deprecated Issues are loaded per-column */
  grouped_issues?: Record<string, IssueApi[]>
  columns: KanbanBoardColumnApi[]
  filters?: KanbanBoardFiltersApi
}

export type IssueCommentApi = {
  id: string
  issue: string
  author: string
  body: string
  created_at: string
  updated_at: string
}

export type IssueActivityApi = {
  id: string
  actor: string | null
  event_type: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export type IssueAttachmentApi = {
  id: string
  issue: string
  uploaded_by: string
  file: string
  created_at: string
}

export type IssueSubtaskApi = {
  id: string
  key: string
  title: string
  done: boolean
  created_at: string
  updated_at: string
}

export type UpdateSubtaskPayload = {
  title?: string
  done?: boolean
}

function normalizeIssueType(type?: string): CreateIssuePayload['type'] {
  if (!type) return type
  if (
    type === 'task' ||
    type === 'bug' ||
    type === 'story' ||
    type === 'epic' ||
    type === 'subtask'
  ) {
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
  filters: IssueListQuery = {},
): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = { project: projectId }

  if (filters.sprint === null) {
    params.sprint = 'null'
  } else if (filters.sprint) {
    params.sprint = filters.sprint
  }
  if (filters.search) params.search = filters.search
  if (filters.assignee) params.assignee = filters.assignee
  if (filters.priority) params.priority = filters.priority
  if (filters.status) params.status = filters.status
  if (filters.sort) params.sort = filters.sort
  if (filters.label && filters.label.length > 0) {
    params.label = filters.label
  }
  if (filters.page != null) params.page = String(filters.page)
  if (filters.page_size != null) params.page_size = String(filters.page_size)

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

export async function listIssuesPaginated(
  projectId: string,
  query: IssueListQuery = {},
): Promise<IssueListPaginationApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<IssueListPaginationApi>>('/issues', {
      params: buildIssueQueryParams(projectId, {
        page: 1,
        page_size: 10,
        ...query,
      }),
    })
    return data.data
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

export async function getProjectKanban(
  projectId: string,
  query?: BoardColumnQuery,
): Promise<KanbanBoardApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ board: KanbanBoardApi }>>(
      `/projects/${projectId}/board`,
      { params: buildBoardColumnQueryParams(query) },
    )
    return data.data.board
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getBoardColumnIssues(
  projectId: string,
  columnId: string,
  query?: BoardColumnQuery,
): Promise<KanbanColumnIssuesApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<KanbanColumnIssuesApi>>(
      `/projects/${projectId}/board/columns/${columnId}`,
      { params: buildBoardColumnQueryParams(query) },
    )
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export function buildBoardColumnQueryParams(
  query?: BoardColumnQuery,
): Record<string, string | number | string[]> | undefined {
  if (!query) return undefined

  const params: Record<string, string | number | string[]> = {}
  if (query.page) params.page = query.page
  params.page_size = query.page_size ?? DEFAULT_KANBAN_PAGE_SIZE
  if (query.assignee) params.assignee = query.assignee
  if (query.status) params.status = query.status
  if (query.priority) params.priority = query.priority
  if (query.search) params.search = query.search
  if (query.dueDate) params.dueDate = query.dueDate
  if (query.label?.length) params.label = query.label
  if (query.labels) params.labels = query.labels
  return params
}

export async function getKanbanBoardFilters(
  projectId: string,
): Promise<KanbanBoardFiltersApi> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ filters: KanbanBoardFiltersApi }>>(
      `/projects/${projectId}/kanban/filters`,
    )
    return data.data.filters
  } catch (error) {
    throw toApiError(error)
  }
}

/** @deprecated Use getProjectKanban */
export async function getKanban(projectId: string): Promise<KanbanBoardApi> {
  return getProjectKanban(projectId)
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

export async function getIssueComments(issueId: string): Promise<IssueCommentApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ comments: IssueCommentApi[] }>>(
      `/issues/${issueId}/comments`,
    )
    return data.data.comments
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getIssueActivity(issueId: string): Promise<IssueActivityApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ activity: IssueActivityApi[] }>>(
      `/issues/${issueId}/activity`,
    )
    return data.data.activity
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getIssueAttachments(issueId: string): Promise<IssueAttachmentApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ attachments: IssueAttachmentApi[] }>>(
      `/issues/${issueId}/attachments`,
    )
    return data.data.attachments
  } catch (error) {
    throw toApiError(error)
  }
}

export async function uploadIssueAttachment(
  issueId: string,
  file: File,
): Promise<IssueAttachmentApi> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<ApiResponse<{ attachment: IssueAttachmentApi }>>(
      `/issues/${issueId}/attachments`,
      formData,
    )
    return data.data.attachment
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteIssueAttachment(attachmentId: string): Promise<void> {
  try {
    await apiClient.delete(`/attachments/${attachmentId}`)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createComment(
  issueId: string,
  body: string,
): Promise<IssueCommentApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ comment: IssueCommentApi }>>(
      `/issues/${issueId}/comments`,
      { body },
    )
    return data.data.comment
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateComment(
  commentId: string,
  body: string,
): Promise<IssueCommentApi> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ comment: IssueCommentApi }>>(
      `/comments/${commentId}`,
      { body },
    )
    return data.data.comment
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteComment(commentId: string): Promise<void> {
  try {
    await apiClient.delete(`/comments/${commentId}`)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getIssueSubtasks(issueId: string): Promise<IssueSubtaskApi[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<{ subtasks: IssueSubtaskApi[] }>>(
      `/issues/${issueId}/subtasks`,
    )
    return data.data.subtasks
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createIssueSubtask(
  issueId: string,
  title: string,
): Promise<IssueSubtaskApi> {
  try {
    const { data } = await apiClient.post<ApiResponse<{ subtask: IssueSubtaskApi }>>(
      `/issues/${issueId}/subtasks`,
      { title },
    )
    return data.data.subtask
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateSubtask(
  subtaskId: string,
  payload: UpdateSubtaskPayload,
): Promise<IssueSubtaskApi> {
  try {
    const { data } = await apiClient.patch<ApiResponse<{ subtask: IssueSubtaskApi }>>(
      `/subtasks/${subtaskId}`,
      payload,
    )
    return data.data.subtask
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  try {
    await apiClient.delete(`/subtasks/${subtaskId}`)
  } catch (error) {
    throw toApiError(error)
  }
}

export async function deleteIssue(issueId: string): Promise<void> {
  try {
    await apiClient.delete(`/issues/${issueId}`)
  } catch (error) {
    throw toApiError(error)
  }
}
