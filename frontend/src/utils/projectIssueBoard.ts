import { FileText, Globe, Network, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  mapWorkflowToBoardStatus,
  type IssueBoardStatus,
  type IssueWorkflowStatus,
  type ProjectIssue,
} from '@/types/issues'
import type { IssuePriority } from '@/types/kanban'
import type { Project } from '@/types/projects'
import type { Task, TaskPriority, TaskStatus } from '@/types/tasks'

function projectIconFor(project?: Project): LucideIcon {
  switch (project?.icon) {
    case 'mobile':
      return Smartphone
    case 'api':
      return Network
    case 'web':
      return Globe
    default:
      return FileText
  }
}

function mapKanbanPriority(priority?: IssuePriority): TaskPriority {
  if (priority === 'high') return 'high'
  if (priority === 'medium') return 'medium'
  if (priority === 'low') return 'low'
  return 'none'
}

export function workflowStatusToTaskStatus(
  workflowStatus: IssueWorkflowStatus | undefined,
  boardStatus: IssueBoardStatus,
): TaskStatus {
  if (workflowStatus) {
    return workflowStatus as TaskStatus
  }
  if (boardStatus === 'done') return 'done'
  if (boardStatus === 'in_progress') return 'in_progress'
  return 'todo'
}

export function taskStatusToWorkflowStatus(status: TaskStatus): IssueWorkflowStatus {
  return status as IssueWorkflowStatus
}

export function projectIssueToBoardTask(
  issue: ProjectIssue,
  project?: Project,
): Task {
  const labelVariant = issue.label.toLowerCase().includes('critical')
    ? 'critical'
    : undefined

  return {
    id: issue.id,
    key: issue.key,
    title: issue.title,
    priority: mapKanbanPriority(issue.priority),
    status: workflowStatusToTaskStatus(issue.workflowStatus, issue.status),
    project: project?.name ?? 'Project',
    projectIcon: projectIconFor(project),
    label: issue.label,
    labelVariant,
    dueDate: issue.dueDate ?? '',
    dueOverdue: false,
    assignee: issue.assignee,
  }
}

export function statusPatchForTaskStatus(status: TaskStatus): Pick<
  ProjectIssue,
  'workflowStatus' | 'status' | 'done'
> {
  const workflowStatus = taskStatusToWorkflowStatus(status)
  return {
    workflowStatus,
    status: mapWorkflowToBoardStatus(workflowStatus),
    done: status === 'done',
  }
}
