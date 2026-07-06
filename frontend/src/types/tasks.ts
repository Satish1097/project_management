import type { LucideIcon } from 'lucide-react'

export type TaskPriority = 'high' | 'medium' | 'low' | 'none'

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'testing'
  | 'blocked'
  | 'done'

export type TaskAssignee = {
  name: string
  color: string
}

export type Task = {
  id: string
  key: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  project: string
  projectIcon: LucideIcon
  label: string
  labelVariant?: 'default' | 'critical'
  sprintName?: string | null
  dueDate: string
  dueOverdue?: boolean
  assignee: TaskAssignee
}

export type IssueViewMode = 'list' | 'board'

export type IssueFilters = {
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  project: string | 'all'
}

export type IssueSortKey = 'dueDate' | 'priority' | 'title' | 'default'
