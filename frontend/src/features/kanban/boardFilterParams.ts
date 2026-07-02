import type { KanbanBoardFilterMetadata, KanbanBoardFilters } from '@/types/kanban'
import { DEFAULT_KANBAN_FILTERS } from '@/features/kanban/kanbanFilters'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidAssignee(
  value: string,
  metadata: KanbanBoardFilterMetadata | null,
): value is KanbanBoardFilters['assigneeId'] {
  if (value === 'all' || value === 'unassigned') return true
  if (!UUID_RE.test(value)) return false
  if (!metadata) return true
  return metadata.assignees.some((assignee) => assignee.id === value)
}

function isValidPriority(
  value: string,
  metadata: KanbanBoardFilterMetadata | null,
): value is KanbanBoardFilters['priority'] {
  if (!metadata) {
    return value === 'all' || ['low', 'medium', 'high', 'critical'].includes(value)
  }
  return metadata.priorities.some((priority) => priority.id === value)
}

function isValidStatus(
  value: string,
  metadata: KanbanBoardFilterMetadata | null,
): value is KanbanBoardFilters['statusId'] {
  if (value === 'all') return true
  if (!UUID_RE.test(value)) return false
  if (!metadata) return true
  return metadata.statuses.some((status) => status.id === value)
}

function parseLabelIds(
  searchParams: URLSearchParams,
  metadata: KanbanBoardFilterMetadata | null,
): string[] {
  const rawValues = [
    ...searchParams.getAll('label'),
    ...(searchParams.get('labels')?.split(',').map((value) => value.trim()) ?? []),
  ].filter(Boolean)

  if (!metadata) return rawValues

  const validIds = new Set(metadata.labels.map((label) => label.id))
  const validNames = new Map(
    metadata.labels.map((label) => [label.name.toLowerCase(), label.id]),
  )

  const ids = new Set<string>()
  for (const value of rawValues) {
    if (validIds.has(value)) {
      ids.add(value)
      continue
    }
    const byName = validNames.get(value.toLowerCase())
    if (byName) ids.add(byName)
  }
  return [...ids]
}

export function parseKanbanFiltersFromSearchParams(
  searchParams: URLSearchParams,
  metadata: KanbanBoardFilterMetadata | null = null,
): KanbanBoardFilters {
  const filters: KanbanBoardFilters = { ...DEFAULT_KANBAN_FILTERS }

  const assignee = searchParams.get('assignee')
  if (assignee && isValidAssignee(assignee, metadata)) {
    filters.assigneeId = assignee
  }

  const priority = searchParams.get('priority')
  if (priority && isValidPriority(priority, metadata)) {
    filters.priority = priority
  }

  const status = searchParams.get('status')
  if (status && isValidStatus(status, metadata)) {
    filters.statusId = status
  }

  filters.labels = parseLabelIds(searchParams, metadata)

  return filters
}

export function syncKanbanFiltersToSearchParams(
  filters: KanbanBoardFilters,
  prev: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(prev)

  if (filters.assigneeId === 'all') {
    next.delete('assignee')
  } else {
    next.set('assignee', filters.assigneeId)
  }

  if (filters.priority === 'all') {
    next.delete('priority')
  } else {
    next.set('priority', filters.priority)
  }

  if (filters.statusId === 'all') {
    next.delete('status')
  } else {
    next.set('status', filters.statusId)
  }

  next.delete('label')
  next.delete('labels')
  if (filters.labels.length > 0) {
    next.set('labels', filters.labels.join(','))
  }

  return next
}
