import type { IssueListQuery } from '@/api/issues'
import type { KanbanBoardFilters } from '@/types/kanban'

export const DEFAULT_LIST_PAGE_SIZE = 10

export function parseListPage(searchParams: URLSearchParams): number {
  const parsed = Number(searchParams.get('page') ?? '1')
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

export function parseListPageSize(searchParams: URLSearchParams): number {
  const parsed = Number(searchParams.get('page_size') ?? String(DEFAULT_LIST_PAGE_SIZE))
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIST_PAGE_SIZE
  return Math.min(100, Math.floor(parsed))
}

export function kanbanFiltersToIssueListQuery(
  filters: KanbanBoardFilters,
): Pick<IssueListQuery, 'assignee' | 'priority' | 'label'> {
  const query: Pick<IssueListQuery, 'assignee' | 'priority' | 'label'> = {}

  if (filters.assigneeId === 'unassigned') {
    query.assignee = 'unassigned'
  } else if (filters.assigneeId !== 'all') {
    query.assignee = filters.assigneeId
  }

  if (filters.priority !== 'all') {
    query.priority = filters.priority
  }

  if (filters.labels.length > 0) {
    query.label = filters.labels
  }

  return query
}

export function boardListQueryFromSearchParams(
  searchParams: URLSearchParams,
  filters: KanbanBoardFilters,
  sprintId?: string,
): IssueListQuery {
  const query: IssueListQuery = {
    page: parseListPage(searchParams),
    page_size: parseListPageSize(searchParams),
    ...kanbanFiltersToIssueListQuery(filters),
  }

  if (sprintId) {
    query.sprint = sprintId
  }

  const search = searchParams.get('search')
  if (search) query.search = search

  const status = searchParams.get('status')
  if (status) query.status = status

  const sort = searchParams.get('sort')
  if (sort) query.sort = sort

  return query
}
