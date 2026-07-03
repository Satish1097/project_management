import type { IssuePriorityLevel } from '@/types/issues'

export type IssuePriority = 'high' | 'medium' | 'low'

export type IssueStatus = 'todo' | 'in_progress' | 'done'

/** Workflow status slug from the backend (e.g. todo, in_progress, done). */
export type KanbanColumnId = string

export type KanbanAssigneeFilter = 'all' | 'unassigned' | string

export type KanbanPriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'

export type KanbanStatusFilter = 'all' | string

export type KanbanBoardFilters = {
  assigneeId: KanbanAssigneeFilter
  priority: KanbanPriorityFilter
  statusId: KanbanStatusFilter
  labels: string[]
}

export type KanbanBoardFilterMetadata = {
  assignees: {
    id: string
    display_name: string
    avatar: string | null
  }[]
  statuses: {
    id: string
    slug: string
    name: string
    color?: string | null
  }[]
  labels: {
    id: string
    name: string
    color: string
  }[]
  priorities: {
    id: string
    label: string
  }[]
}

export type KanbanIssue = {
  id: string
  key: string
  title: string
  priority?: IssuePriority
  priorityLevel?: IssuePriorityLevel | string
  label: string
  labels: string[]
  statusId?: string
  assigneeId: string | null
  assignee: { name: string; color: string }
  progress?: number
  done?: boolean
}

export type KanbanColumn = {
  id: KanbanColumnId
  statusId?: string
  title: string
  dotColor: string
  count: number
  issues: KanbanIssue[]
  isDoneStatus?: boolean
}

/** Per-column pagination state for Jira-style board loading. */
export type KanbanColumnState = {
  issues: KanbanIssue[]
  page: number
  hasNext: boolean
  loading: boolean
  total: number
}
