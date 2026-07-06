import { FileText, Globe, Network, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { IssueApi } from '@/api/issues'
import { mapIssueToUi } from '@/services/mapIssueApi'
import { getSprintById } from '@/services/projectData'
import { projectIssueToBoardTask } from '@/utils/projectIssueBoard'
import type { KanbanColumn, KanbanIssue } from '@/types/kanban'
import type { Project } from '@/types/projects'
import type { Task, TaskStatus } from '@/types/tasks'

function projectIconFor(project: Project): LucideIcon {
  switch (project.icon) {
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

function columnIdToTaskStatus(columnId: string): TaskStatus {
  const known: Record<string, TaskStatus> = {
    backlog: 'backlog',
    todo: 'todo',
    in_progress: 'in_progress',
    review: 'review',
    in_review: 'review',
    testing: 'testing',
    blocked: 'blocked',
    done: 'done',
  }
  return known[columnId] ?? 'todo'
}

export function kanbanIssueToTask(
  issue: KanbanIssue,
  columnId: string,
  project: Project,
): Task {
  const labelVariant = issue.label.toLowerCase().includes('critical')
    ? 'critical'
    : undefined

  return {
    id: issue.id,
    key: issue.key,
    title: issue.title,
    priority: issue.priority ?? 'none',
    status: columnIdToTaskStatus(columnId),
    project: project.name,
    projectIcon: projectIconFor(project),
    label: issue.label,
    labelVariant,
    dueDate: '',
    dueOverdue: false,
    assignee: issue.assignee,
  }
}

export function kanbanColumnsToTasks(
  columns: KanbanColumn[],
  project: Project,
): Task[] {
  return columns.flatMap((column) =>
    column.issues.map((issue) => kanbanIssueToTask(issue, column.id, project)),
  )
}

export function issueApiToTask(issue: IssueApi, project: Project): Task {
  const task = projectIssueToBoardTask(mapIssueToUi(issue, project.id), project)
  const sprint = issue.sprint
  let sprintName: string | null = null
  if (sprint) {
    sprintName =
      typeof sprint === 'object'
        ? sprint.name
        : getSprintById(project.id, sprint)?.name ?? null
  }
  return { ...task, sprintName }
}
