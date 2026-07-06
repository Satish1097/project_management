import type { IssueApi } from '@/api/issues'
import type {
  IssuePriorityLevel,
  IssueType,
  IssueWorkflowStatus,
  ProjectIssue,
} from '@/types/issues'
import {
  mapPriorityLevelToKanban,
  mapWorkflowToBoardStatus,
} from '@/types/issues'

const UNASSIGNED = { name: 'Unassigned', color: '#94a3b8' }

const ASSIGNEE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length]
}

function resolveAssigneeId(assignee: IssueApi['assignee']): string | null {
  if (!assignee) return null
  return assignee
}

function resolveSprintId(sprint: IssueApi['sprint']): string | null {
  if (!sprint) return null
  if (typeof sprint === 'object') return sprint.id
  return sprint
}

function resolveAssignee(
  assigneeId: string | null,
  displayName?: string,
): ProjectIssue['assignee'] {
  if (!assigneeId) return UNASSIGNED
  if (displayName) {
    return {
      name: displayName,
      color: colorForName(displayName),
      userId: assigneeId,
    }
  }
  return {
    userId: assigneeId,
    name: 'Member',
    color: colorForName(assigneeId),
  }
}

export function mapIssueToUi(issue: IssueApi, projectId?: string): ProjectIssue {
  const pid = projectId ?? issue.project
  const workflowStatus = issue.status.slug as IssueWorkflowStatus
  const priorityLevel = issue.priority as IssuePriorityLevel
  const labelNames = issue.labels.map((label) => label.name)
  const assigneeId = resolveAssigneeId(issue.assignee)

  return {
    id: issue.id,
    projectId: pid,
    sprintId: resolveSprintId(issue.sprint),
    key: issue.key,
    title: issue.title,
    status: mapWorkflowToBoardStatus(workflowStatus),
    workflowStatus,
    label: labelNames[0] ?? issue.type,
    issueType: issue.type as IssueType,
    priorityLevel,
    priority: mapPriorityLevelToKanban(priorityLevel),
    assignee: resolveAssignee(assigneeId),
    assigneeId,
    labelIds: issue.labels.map((label) => label.id),
    labels: labelNames.length > 0 ? labelNames : undefined,
    description: issue.description || undefined,
    storyPoints: issue.story_points ?? undefined,
    estimateHours:
      issue.estimate_hours != null ? Number(issue.estimate_hours) : undefined,
    dueDate: issue.due_date ?? undefined,
    reporterId: issue.reporter,
  }
}

export function mapIssueSummaryToUi(issue: IssueApi, projectId: string): ProjectIssue {
  return mapIssueToUi(issue, projectId)
}

export function mapIssueDetailToUi(issue: IssueApi, projectId: string): ProjectIssue {
  return mapIssueToUi(issue, projectId)
}

export function isApiIssueId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
}
