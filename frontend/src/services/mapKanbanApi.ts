import type { KanbanBoardApi } from '@/api/issues'
import { DEFAULT_WORKFLOW_COLUMNS } from '@/services/workflowConfig'
import { mapIssueSummaryToUi } from '@/services/mapIssueApi'
import { getIssueById, upsertApiIssue } from '@/services/issuesRegistry'
import type { KanbanColumn, KanbanIssue } from '@/types/kanban'
import type { IssuePriorityLevel } from '@/types/issues'

function dotColorForStatus(slug: string): string {
  const column = DEFAULT_WORKFLOW_COLUMNS.find((item) => item.id === slug)
  return column?.dotColor ?? 'var(--df-kanban-status-todo)'
}

function mapPriority(priority: string): KanbanIssue['priority'] {
  if (priority === 'high' || priority === 'critical' || priority === 'blocker') {
    return 'high'
  }
  if (priority === 'low' || priority === 'lowest') {
    return 'low'
  }
  return 'medium'
}

export function mapKanbanBoardToColumns(
  board: KanbanBoardApi,
  projectId: string,
): KanbanColumn[] {
  for (const column of board.columns) {
    for (const issue of column.issues) {
      upsertApiIssue(mapIssueSummaryToUi(issue, projectId))
    }
  }

  return board.columns.map((column) => ({
    id: column.status_slug,
    title: column.status_name.toUpperCase(),
    dotColor: dotColorForStatus(column.status_slug),
    count: column.issues.length,
    issues: column.issues.map((issue) => {
      const registryIssue = getIssueById(issue.id)
      const uiIssue = mapIssueSummaryToUi(issue, projectId)
      return {
        id: issue.id,
        key: issue.key,
        title: issue.title,
        priority: mapPriority(issue.priority),
        priorityLevel: issue.priority as IssuePriorityLevel,
        label: issue.type,
        labels: registryIssue?.labels ?? issue.labels.map((label) => label.name),
        assigneeId: issue.assignee,
        assignee: uiIssue.assignee,
        done: column.status_slug === 'done',
      }
    }),
  }))
}

export function priorityLevelFromKanbanPriority(
  priority: KanbanIssue['priority'],
): IssuePriorityLevel {
  if (priority === 'high') return 'high'
  if (priority === 'low') return 'low'
  return 'medium'
}
