import type {
  KanbanBoardFilters,
  KanbanColumn,
  KanbanIssue,
  KanbanPriorityFilter,
} from '@/types/kanban'

export const KANBAN_LABEL_FILTER_OPTIONS = [
  'frontend',
  'backend',
  'bug',
  'feature',
  'urgent',
] as const

export const KANBAN_PRIORITY_FILTER_OPTIONS: {
  id: KanbanPriorityFilter
  label: string
}[] = [
  { id: 'all', label: 'All' },
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
]

export const DEFAULT_KANBAN_FILTERS: KanbanBoardFilters = {
  assigneeId: 'all',
  priority: 'all',
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

export function issueMatchesKanbanFilters(
  issue: KanbanIssue,
  filters: KanbanBoardFilters,
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

  if (filters.labels.length > 0) {
    const issueLabels = new Set(
      [...issue.labels, issue.label].map((label) => label.toLowerCase()),
    )
    const hasMatch = filters.labels.some((label) =>
      issueLabels.has(label.toLowerCase()),
    )
    if (!hasMatch) return false
  }

  return true
}

export function filterKanbanColumns(
  columns: KanbanColumn[],
  filters: KanbanBoardFilters,
): KanbanColumn[] {
  return columns.map((column) => {
    const issues = column.issues.filter((issue) =>
      issueMatchesKanbanFilters(issue, filters),
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
    filters.labels.length > 0
  )
}
