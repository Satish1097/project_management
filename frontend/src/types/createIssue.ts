import type {
  IssueComponent,
  IssuePriorityLevel,
  IssueType,
  IssueWorkflowStatus,
} from '@/types/issues'

export type CreateIssueFormValues = {
  title: string
  description: string
  issueType: IssueType
  priority: IssuePriorityLevel
  status: IssueWorkflowStatus
  labels: string[]
  projectId: string
  sprintId: string
  assigneeId: string
  reporterId: string
  component: IssueComponent | ''
  storyPoints: string
  dueDate: string
  estimatedTime: string
  acceptanceCriteria: string
  parentIssueId: string
}

export const DEFAULT_CREATE_ISSUE_VALUES: CreateIssueFormValues = {
  title: '',
  description: '',
  issueType: 'task',
  priority: 'medium',
  status: 'backlog',
  labels: [],
  projectId: '',
  sprintId: '',
  assigneeId: '',
  reporterId: '',
  component: '',
  storyPoints: '',
  dueDate: '',
  estimatedTime: '',
  acceptanceCriteria: '',
  parentIssueId: '',
}

export const ISSUE_TITLE_MAX_LENGTH = 200
export const ISSUE_DESCRIPTION_MAX_LENGTH = 8000
export const ISSUE_ACCEPTANCE_MAX_LENGTH = 4000
