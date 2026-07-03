import type { IssueApi, KanbanBoardApi } from '@/api/issues'
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

export function mapApiIssuesToKanbanIssues(
  issues: IssueApi[],
  projectId: string,
  statusId: string,
  isDoneStatus: boolean,
): KanbanIssue[] {
  return issues.map((issue) => {
    upsertApiIssue(mapIssueSummaryToUi(issue, projectId))
    const uiIssue = mapIssueSummaryToUi(issue, projectId)
    return {
      id: issue.id,
      key: issue.key,
      title: issue.title,
      priority: mapPriority(issue.priority),
      priorityLevel: issue.priority as IssuePriorityLevel,
      label: uiIssue.label,
      labels: issue.labels.map((label) => label.name),
      statusId,
      assigneeId: issue.assignee,
      assignee: uiIssue.assignee,
      done: isDoneStatus,
    }
  })
}

/** Map board metadata (no issues) into column shells for the kanban UI. */
export function mapKanbanBoardToColumns(
  board: KanbanBoardApi,
  projectId: string,
): KanbanColumn[] {
  const columnsBySlug = new Map(
    board.columns.map((column) => [column.status_slug, column]),
  )
  const workflowColumns =
    board.workflow_columns && board.workflow_columns.length > 0
      ? board.workflow_columns
      : board.columns.filter(hasStatus).map((column) => column.status)

  return workflowColumns.map((status) => {
    const column = columnsBySlug.get(status.slug)
    const statusId = column?.status_id ?? column?.id ?? status.id
    const isDoneStatus = status.is_terminal === true || status.category === 'done'

    return {
      id: status.slug,
      statusId,
      title: (column?.name ?? column?.status_name ?? status.name).toUpperCase(),
      dotColor: dotColorForStatus(status),
      count: column?.count ?? 0,
      issues: [],
      isDoneStatus,
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
