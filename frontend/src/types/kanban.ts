export type IssuePriority = 'high' | 'medium' | 'low'

export type IssueStatus = 'todo' | 'in_progress' | 'done'

export type KanbanColumnId = IssueStatus | 'in_review' | 'blocked'

export type KanbanIssue = {
  id: string
  key: string
  title: string
  priority?: IssuePriority
  label: string
  assignee: { name: string; color: string }
  progress?: number
  done?: boolean
}

export type KanbanColumn = {
  id: KanbanColumnId
  title: string
  dotColor: string
  count: number
  issues: KanbanIssue[]
}
