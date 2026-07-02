import type {
  KanbanBoardFilterMetadata,
  KanbanBoardFilters,
  KanbanColumn,
  KanbanIssue,
  KanbanPriorityFilter,
} from '@/types/kanban'

export const DEFAULT_KANBAN_FILTERS: KanbanBoardFilters = {
  assigneeId: 'all',
  priority: 'all',
  statusId: 'all',
  labels: [],
}

export function normalizePriorityForFilter(
  priorityLevel: string | undefined,
): KanbanPriorityFilter | null {
  if (!priorityLevel) return null
  if (priorityLevel === 'lowest' || priorityLevel === 'low') return 'low'
  if (priorityLevel === 'medium') return 'medium'
  if (priorityLevel === 'high' || priorityLevel === 'blocker') return 'high'
  if (priorityLevel === 'critical') return 'critical'
  return null
}

function selectedLabelNames(
  filters: KanbanBoardFilters,
  metadata: KanbanBoardFilterMetadata | null,
): Set<string> {
  if (!metadata || filters.labels.length === 0) return new Set()

  const names = filters.labels
    .map((labelId) => metadata.labels.find((label) => label.id === labelId)?.name)
    .filter((name): name is string => Boolean(name))
    .map((name) => name.toLowerCase())

  return new Set(names)
}

export function issueMatchesKanbanFilters(
  issue: KanbanIssue,
  filters: KanbanBoardFilters,
  metadata: KanbanBoardFilterMetadata | null = null,
): boolean {
  if (filters.assigneeId !== 'all') {
    if (filters.assigneeId === 'unassigned') {
      if (issue.assigneeId !== null) return false
    } else if (issue.assigneeId !== filters.assigneeId) {
      return false
    }
  }

  if (filters.priority !== 'all') {
    const normalized = normalizePriorityForFilter(issue.priorityLevel)
    if (normalized !== filters.priority) return false
  }

  if (filters.statusId !== 'all') {
    if (issue.statusId !== filters.statusId) return false
  }

  if (filters.labels.length > 0) {
    const selectedNames = selectedLabelNames(filters, metadata)
    const issueLabels = new Set(
      [...issue.labels, issue.label].map((label) => label.toLowerCase()),
    )
    const hasMatch = [...selectedNames].some((label) => issueLabels.has(label))
    if (!hasMatch) return false
  }

  return true
}

export function filterKanbanColumns(
  columns: KanbanColumn[],
  filters: KanbanBoardFilters,
  metadata: KanbanBoardFilterMetadata | null = null,
): KanbanColumn[] {
  return columns.map((column) => {
    const issues = column.issues.filter((issue) =>
      issueMatchesKanbanFilters(issue, filters, metadata),
    )
    return {
      ...column,
      issues,
      count: issues.length,
    }
  })
}

export function hasActiveKanbanFilters(filters: KanbanBoardFilters): boolean {
  return (
    filters.assigneeId !== 'all' ||
    filters.priority !== 'all' ||
    filters.statusId !== 'all' ||
    filters.labels.length > 0
  )
}
