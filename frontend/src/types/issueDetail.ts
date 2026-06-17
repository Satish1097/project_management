import type { IssueAssignee } from '@/types/issues'

export type IssueActivityType =
  | 'status_changed'
  | 'assignee_updated'
  | 'comment_added'
  | 'priority_changed'
  | 'sprint_changed'
  | 'label_added'
  | 'created'

export type IssueActivityItem = {
  id: string
  type: IssueActivityType
  actor: IssueAssignee
  message: string
  timestamp: string
}

export type IssueComment = {
  id: string
  authorId?: string
  author: IssueAssignee
  body: string
  createdAt?: string
  timestamp: string
  /** Future: threaded replies */
  parentId?: string
}

export type IssueSubtask = {
  id: string
  title: string
  done: boolean
}

export type IssueDetailExtras = {
  description: string
  acceptanceCriteria: string
  epic?: string
  reporter: IssueAssignee
  createdBy: string
  createdAt: string
  updatedAt: string
  activity: IssueActivityItem[]
  comments: IssueComment[]
  subtasks: IssueSubtask[]
}
