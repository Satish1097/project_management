import type { IssuePriority } from '@/types/kanban'

export type IssueBoardStatus = 'todo' | 'in_progress' | 'done'

export type IssueType =
  | 'task'
  | 'bug'
  | 'story'
  | 'epic'
  | 'improvement'
  | 'subtask'
  | 'spike'

export type IssuePriorityLevel =
  | 'lowest'
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'
  | 'blocker'

export type IssueWorkflowStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'testing'
  | 'done'
  | 'blocked'

export type IssueComponent =
  | 'backend'
  | 'frontend'
  | 'infrastructure'
  | 'qa'
  | 'security'

export type IssueAttachment = {
  id: string
  name: string
  size: number
  mimeType: string
  previewUrl?: string
}

export type IssueAssignee = {
  name: string
  color: string
}

export type ProjectIssue = {
  id: string
  projectId: string
  /** null = backlog */
  sprintId: string | null
  key: string
  title: string
  /** Kanban column status */
  status: IssueBoardStatus
  /** Primary label shown on cards */
  label: string
  assignee: IssueAssignee
  /** Legacy kanban priority */
  priority?: IssuePriority
  issueType?: IssueType
  priorityLevel?: IssuePriorityLevel
  workflowStatus?: IssueWorkflowStatus
  labels?: string[]
  description?: string
  acceptanceCriteria?: string
  reporterId?: string
  component?: IssueComponent
  storyPoints?: number
  dueDate?: string
  estimatedTime?: string
  attachments?: IssueAttachment[]
  progress?: number
  done?: boolean
}

export function mapWorkflowToBoardStatus(
  status: IssueWorkflowStatus,
): IssueBoardStatus {
  switch (status) {
    case 'in_progress':
    case 'review':
    case 'testing':
      return 'in_progress'
    case 'done':
      return 'done'
    default:
      return 'todo'
  }
}

export function mapPriorityLevelToKanban(
  priority: IssuePriorityLevel,
): IssuePriority | undefined {
  switch (priority) {
    case 'lowest':
    case 'low':
      return 'low'
    case 'medium':
      return 'medium'
    case 'high':
    case 'critical':
    case 'blocker':
      return 'high'
  }
}
