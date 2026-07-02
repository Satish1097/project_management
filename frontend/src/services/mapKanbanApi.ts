import type { KanbanBoardApi } from '@/api/issues'
import { mapIssueSummaryToUi } from '@/services/mapIssueApi'
import { upsertApiIssue } from '@/services/issuesRegistry'
import type { KanbanColumn, KanbanIssue } from '@/types/kanban'
import type { IssuePriorityLevel } from '@/types/issues'

type KanbanWorkflowColumn = NonNullable<KanbanBoardApi['workflow_columns']>[number]

const DEFAULT_DOT_COLOR = '#94a3b8'

function hasStatus(
  column: KanbanBoardApi['columns'][number],
): column is KanbanBoardApi['columns'][number] & { status: KanbanWorkflowColumn } {
  return Boolean(column.status)
}

function dotColorForStatus(status: KanbanWorkflowColumn | undefined): string {
  return status?.color || DEFAULT_DOT_COLOR
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

  const columnsBySlug = new Map(
    board.columns.map((column) => [column.status_slug, column]),
  )
  const workflowColumns =
    board.workflow_columns && board.workflow_columns.length > 0
      ? board.workflow_columns
      : board.columns.filter(hasStatus).map((column) => column.status)

  return workflowColumns.map((status) => {
    const column = columnsBySlug.get(status.slug)
    const issues = column?.issues ?? board.grouped_issues?.[status.slug] ?? []
    const isDoneStatus = status.is_terminal === true || status.category === 'done'

    return {
      id: status.slug,
      statusId: column?.status_id ?? status.id,
      title: status.name.toUpperCase(),
      dotColor: dotColorForStatus(status),
      count: issues.length,
      issues: issues.map((issue) => {
        const uiIssue = mapIssueSummaryToUi(issue, projectId)
        return {
          id: issue.id,
          key: issue.key,
          title: issue.title,
          priority: mapPriority(issue.priority),
          priorityLevel: issue.priority as IssuePriorityLevel,
          label: uiIssue.label,
          labels: issue.labels.map((label) => label.name),
          statusId: column?.status_id ?? status.id,
          assigneeId: issue.assignee,
          assignee: uiIssue.assignee,
          done: isDoneStatus,
        }
      }),
    }
  })
}

export function priorityLevelFromKanbanPriority(
  priority: KanbanIssue['priority'],
): IssuePriorityLevel {
  if (priority === 'high') return 'high'
  if (priority === 'low') return 'low'
  return 'medium'
}
