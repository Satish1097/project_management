import type { IssuePriorityLevel } from '@/types/issues'

export type IssuePriority = 'high' | 'medium' | 'low'

export type IssueStatus = 'todo' | 'in_progress' | 'done'

/** Workflow status slug from the backend (e.g. todo, in_progress, done). */
export type KanbanColumnId = string

export type KanbanAssigneeFilter = 'all' | 'unassigned' | string

export type KanbanPriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical'

export type KanbanBoardFilters = {
  assigneeId: KanbanAssigneeFilter
  priority: KanbanPriorityFilter
  labels: string[]
}

export type KanbanIssue = {
  id: string
  key: string
  title: string
  priority?: IssuePriority
  priorityLevel?: IssuePriorityLevel | string
  label: string
  labels: string[]
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
}
