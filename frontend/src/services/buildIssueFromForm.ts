import { CURRENT_USER } from '@/constants/currentUser'
import { mockMembers } from '@/services/mockMembers'
import { getProjectByIdFromRegistry } from '@/services/projectsRegistry'
import { generateIssueKey } from '@/services/issuesRegistry'
import type { CreateIssueFormValues } from '@/types/createIssue'
import type { ProjectIssue } from '@/types/issues'
import {
  mapPriorityLevelToKanban,
  mapWorkflowToBoardStatus,
} from '@/types/issues'

const UNASSIGNED = { name: 'Unassigned', color: '#94a3b8' }

function resolveAssignee(assigneeId: string) {
  if (!assigneeId) return UNASSIGNED
  const member = mockMembers.find((m) => m.id === assigneeId)
  if (!member) return UNASSIGNED
  return { name: member.name, color: member.color }
}

export function buildIssueFromForm(
  values: CreateIssueFormValues,
  attachments: ProjectIssue['attachments'],
): ProjectIssue {
  const project = getProjectByIdFromRegistry(values.projectId)
  const projectKey = project?.key ?? 'ISS'
  const key = generateIssueKey(projectKey, values.projectId)
  const sprintId = values.sprintId ? values.sprintId : null
  const primaryLabel = values.labels[0] ?? values.component ?? 'general'
  const done = values.status === 'done'

  return {
    id: `i-${Date.now()}`,
    projectId: values.projectId,
    sprintId,
    key,
    title: values.title.trim(),
    status: mapWorkflowToBoardStatus(values.status),
    workflowStatus: values.status,
    label: primaryLabel,
    labels: values.labels.length > 0 ? values.labels : undefined,
    assignee: resolveAssignee(values.assigneeId),
    priority: mapPriorityLevelToKanban(values.priority),
    priorityLevel: values.priority,
    issueType: values.issueType,
    description: values.description.trim() || undefined,
    acceptanceCriteria: values.acceptanceCriteria.trim() || undefined,
    reporterId: values.reporterId || CURRENT_USER.id,
    component: values.component || undefined,
    storyPoints: values.storyPoints ? Number(values.storyPoints) : undefined,
    dueDate: values.dueDate || undefined,
    estimatedTime: values.estimatedTime.trim() || undefined,
    attachments: attachments?.length ? attachments : undefined,
    done,
  }
}
