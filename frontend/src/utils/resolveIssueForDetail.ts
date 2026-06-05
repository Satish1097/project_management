import { getIssueById, getIssueByKey } from '@/services/issuesRegistry'
import type { ProjectIssue, IssueBoardStatus } from '@/types/issues'
import type { Task, TaskStatus } from '@/types/tasks'

function mapTaskStatusToBoard(status: TaskStatus): IssueBoardStatus {
  if (status === 'done') return 'done'
  if (
    status === 'in_progress' ||
    status === 'review' ||
    status === 'testing'
  ) {
    return 'in_progress'
  }
  return 'todo'
}

function mapTaskPriority(priority: Task['priority']) {
  if (priority === 'high') return 'high' as const
  if (priority === 'medium') return 'medium' as const
  if (priority === 'low') return 'low' as const
  return 'medium' as const
}

export function projectIssueFromTask(task: Task): ProjectIssue {
  return {
    id: `task-${task.id}`,
    projectId: '0',
    sprintId: null,
    key: task.key,
    title: task.title,
    status: mapTaskStatusToBoard(task.status),
    label: task.label,
    labels: [task.label.toLowerCase()],
    assignee: task.assignee,
    priority: mapTaskPriority(task.priority),
    workflowStatus: task.status as ProjectIssue['workflowStatus'],
    description: undefined,
    dueDate: task.dueDate,
  }
}

export type ResolveIssueInput =
  | { issueId: string }
  | { issueKey: string }
  | { task: Task }

function syntheticIssueFromKey(key: string): ProjectIssue {
  const prefix = key.split('-')[0] ?? 'DF'
  return {
    id: `synthetic-${key}`,
    projectId: '1',
    sprintId: 'sprint-42',
    key,
    title: `Issue ${key}`,
    status: 'todo',
    label: prefix,
    labels: [prefix.toLowerCase()],
    assignee: { name: 'Sarah Chen', color: '#ec4899' },
    priority: 'medium',
    workflowStatus: 'todo',
  }
}

export function resolveIssueForDetail(
  input: ResolveIssueInput,
): ProjectIssue | undefined {
  if ('issueId' in input) {
    return getIssueById(input.issueId) ?? undefined
  }
  if ('issueKey' in input) {
    return getIssueByKey(input.issueKey) ?? syntheticIssueFromKey(input.issueKey)
  }
  const byKey = getIssueByKey(input.task.key)
  if (byKey) return byKey
  return projectIssueFromTask(input.task)
}
