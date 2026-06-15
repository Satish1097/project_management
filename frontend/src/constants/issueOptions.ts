import type { IssueComponent, IssueType, IssueWorkflowStatus } from '@/types/issues'
import type { IssuePriorityLevel } from '@/types/issues'

export const ISSUE_TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'story', label: 'Story' },
  { value: 'epic', label: 'Epic' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'subtask', label: 'Subtask' },
  { value: 'spike', label: 'Spike' },
]

export const ISSUE_PRIORITY_OPTIONS: {
  value: IssuePriorityLevel
  label: string
}[] = [
  { value: 'lowest', label: 'Lowest' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
  { value: 'blocker', label: 'Blocker' },
]

export const ISSUE_STATUS_OPTIONS: {
  value: IssueWorkflowStatus
  label: string
}[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
]

export const ISSUE_COMPONENT_OPTIONS: { value: IssueComponent; label: string }[] =
  [
    { value: 'backend', label: 'Backend' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'qa', label: 'QA' },
    { value: 'security', label: 'Security' },
  ]

export const STORY_POINT_OPTIONS = ['1', '2', '3', '5', '8', '13', '21'] as const

export const DEFAULT_PROJECT_LABELS = [
  'backend',
  'frontend',
  'security',
  'performance',
  'api',
  'bugfix',
  'ui',
] as const
