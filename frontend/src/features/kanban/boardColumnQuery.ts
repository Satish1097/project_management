import type { BoardColumnQuery } from '@/api/issues'
import { DEFAULT_KANBAN_PAGE_SIZE } from '@/constants/kanban'
import type { KanbanBoardFilterMetadata, KanbanBoardFilters } from '@/types/kanban'
import { kanbanFiltersToIssueListQuery } from '@/features/kanban/boardListQuery'

export function boardColumnQueryFromFilters(
  filters: KanbanBoardFilters,
  metadata: KanbanBoardFilterMetadata | null,
  searchParams: URLSearchParams,
  page = 1,
  pageSize = DEFAULT_KANBAN_PAGE_SIZE,
): BoardColumnQuery {
  const query: BoardColumnQuery = {
    page,
    page_size: pageSize,
    ...kanbanFiltersToIssueListQuery(filters, metadata),
  }

  const search = searchParams.get('search')
  if (search) query.search = search

  const dueDate = searchParams.get('dueDate') ?? searchParams.get('due_date')
  if (dueDate) query.dueDate = dueDate

  return query
}
