import type { IssueDetailApi, IssueSummaryApi } from '@/api/issues'
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

function resolveAssignee(
  assignee: IssueDetailApi['assignee'],
  assigneeId: string | null,
): ProjectIssue['assignee'] {
  if (assignee?.display_name) {
    return { name: assignee.display_name, color: colorForName(assignee.display_name) }
  }
  if (assigneeId) {
    return { name: 'Assigned', color: '#6366f1' }
  }
  return UNASSIGNED
}

export function mapIssueSummaryToUi(
  issue: IssueSummaryApi,
  projectId: string,
): ProjectIssue {
  const workflowStatus = issue.status_slug as IssueWorkflowStatus
  const priorityLevel = issue.priority as IssuePriorityLevel

  return {
    id: issue.id,
    projectId,
    sprintId: issue.sprint_id,
    key: issue.key,
    title: issue.title,
    status: mapWorkflowToBoardStatus(workflowStatus),
    workflowStatus,
    label: issue.issue_type,
    issueType: issue.issue_type as IssueType,
    priorityLevel,
    priority: mapPriorityLevelToKanban(priorityLevel),
    assignee: resolveAssignee(null, issue.assignee_id),
    storyPoints: undefined,
  }
}

export function mapIssueDetailToUi(
  issue: IssueDetailApi,
  projectId: string,
): ProjectIssue {
  const base = mapIssueSummaryToUi(issue, projectId)

  return {
    ...base,
    description: issue.description || undefined,
    storyPoints: issue.story_points ?? undefined,
    dueDate: issue.due_date ?? undefined,
    labels: issue.labels.length > 0 ? issue.labels : undefined,
    label: issue.labels[0] ?? base.label,
    assignee: resolveAssignee(issue.assignee, issue.assignee_id),
    reporterId: issue.reporter?.id,
  }
}

export function isApiIssueId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id,
  )
}
