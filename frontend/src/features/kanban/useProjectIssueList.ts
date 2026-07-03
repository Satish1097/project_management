import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SetURLSearchParams } from 'react-router-dom'
import { listIssuesPaginated, type IssueListPaginationApi } from '@/api/issues'
import { ApiError } from '@/api/types'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import {
  boardListQueryFromSearchParams,
  DEFAULT_LIST_PAGE_SIZE,
  parseListPage,
} from '@/features/kanban/boardListQuery'
import { issueApiToTask } from '@/features/kanban/kanbanIssueToTask'
import type { KanbanBoardFilterMetadata, KanbanBoardFilters } from '@/types/kanban'
import type { Project } from '@/types/projects'
import type { Task } from '@/types/tasks'

type UseProjectIssueListOptions = {
  project: Project
  sprintId?: string
  enabled: boolean
  filters: KanbanBoardFilters
  filterMetadata?: KanbanBoardFilterMetadata | null
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
}

export function useProjectIssueList({
  project,
  sprintId,
  enabled,
  filters,
  filterMetadata = null,
  searchParams,
  setSearchParams,
}: UseProjectIssueListOptions) {
  const [listPage, setListPage] = useState<IssueListPaginationApi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])
  const previousFiltersKey = useRef(filtersKey)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    fetchIdRef.current += 1
    setListPage(null)
    setError(null)
  }, [project.id, sprintId])

  const query = useMemo(
    () => boardListQueryFromSearchParams(searchParams, filters, sprintId, filterMetadata),
    [filters, filterMetadata, searchParams, sprintId],
  )

  useEffect(() => {
    if (!enabled) return
    if (previousFiltersKey.current === filtersKey) return

    previousFiltersKey.current = filtersKey
    if (parseListPage(searchParams) === 1) return

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('page', '1')
        return next
      },
      { replace: true },
    )
  }, [enabled, filtersKey, searchParams, setSearchParams])

  const loadList = useCallback(async () => {
    if (!enabled) return

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const data = await listIssuesPaginated(project.id, query)
      if (fetchId !== fetchIdRef.current) return
      setListPage(data)
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to load issue list.'
      setError(message)
      setListPage(null)
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [enabled, project.id, query])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    return registerKanbanRefresh(() => {
      void loadList()
    })
  }, [loadList])

  const tasks = useMemo<Task[]>(
    () => listPage?.results.map((issue) => issueApiToTask(issue, project)) ?? [],
    [listPage, project],
  )

  const pagination = useMemo(() => {
    if (!listPage) return null

    const page = query.page ?? 1
    const pageSize = query.page_size ?? DEFAULT_LIST_PAGE_SIZE
    const totalPages = Math.max(1, Math.ceil(listPage.count / pageSize))

    return {
      page,
      pageSize,
      totalCount: listPage.count,
      totalPages,
      hasPrevious: listPage.previous != null,
      hasNext: listPage.next != null,
    }
  }, [listPage, query.page, query.page_size])

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('view', 'list')
          if (nextPage <= 1) {
            next.delete('page')
          } else {
            next.set('page', String(nextPage))
          }
          if (!next.get('page_size') && query.page_size !== DEFAULT_LIST_PAGE_SIZE) {
            next.set('page_size', String(query.page_size))
          }
          return next
        },
        { replace: true },
      )
    },
    [query.page_size, setSearchParams],
  )

  return {
    tasks,
    loading,
    error,
    pagination,
    refreshList: loadList,
    handlePageChange,
  }
}
