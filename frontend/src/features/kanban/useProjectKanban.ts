import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getBoardColumnIssues, getProjectKanban } from '@/api/issues'
import { getSprintBoard, getSprintBoardColumnIssues } from '@/api/sprints'
import { ApiError } from '@/api/types'
import { boardColumnQueryFromFilters } from '@/features/kanban/boardColumnQuery'
import { DEFAULT_KANBAN_PAGE_SIZE } from '@/constants/kanban'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import {
  mapApiIssuesToKanbanIssues,
  mapKanbanBoardToColumns,
} from '@/services/mapKanbanApi'
import type { KanbanBoardApi, KanbanBoardFiltersApi } from '@/api/issues'
import { mergeItemsById } from '@/lib/sectionPagination'
import type {
  KanbanBoardFilterMetadata,
  KanbanBoardFilters,
  KanbanColumn,
  KanbanColumnState,
  KanbanIssue,
} from '@/types/kanban'

const EMPTY_COLUMN_STATE: KanbanColumnState = {
  issues: [],
  page: 0,
  hasNext: false,
  loading: false,
  total: 0,
}

type UseProjectKanbanOptions = {
  sprintId?: string
  enabled?: boolean
  filters?: KanbanBoardFilters
  filterMetadata?: KanbanBoardFilterMetadata | null
  searchParams?: URLSearchParams
}

export function useProjectKanban(
  projectId: string,
  options: UseProjectKanbanOptions = {},
) {
  const {
    sprintId,
    enabled = true,
    filters,
    filterMetadata = null,
    searchParams,
  } = options

  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [columnStates, setColumnStates] = useState<Record<string, KanbanColumnState>>({})
  const [boardFilters, setBoardFilters] = useState<KanbanBoardFiltersApi | null>(null)
  const [hasActiveSprint, setHasActiveSprint] = useState(true)
  const [selectedSprint, setSelectedSprint] = useState<KanbanBoardApi['selected_sprint']>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIdRef = useRef(0)
  const columnFetchIdsRef = useRef<Record<string, number>>({})
  const loadedPagesRef = useRef<Record<string, number[]>>({})

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        filters,
        search: searchParams?.get('search') ?? '',
        dueDate: searchParams?.get('dueDate') ?? searchParams?.get('due_date') ?? '',
      }),
    [filters, searchParams],
  )

  const buildColumnQuery = useCallback(
    (page: number) => {
      if (!filters || !searchParams) {
        return { page, page_size: DEFAULT_KANBAN_PAGE_SIZE }
      }
      return boardColumnQueryFromFilters(filters, filterMetadata, searchParams, page)
    },
    [filters, filterMetadata, searchParams],
  )

  const fetchColumnPage = useCallback(
    async (
      statusId: string,
      page: number,
      append: boolean,
      columnMeta: KanbanColumn,
      fetchGeneration: number,
    ) => {
      const columnFetchId = (columnFetchIdsRef.current[statusId] ?? 0) + 1
      columnFetchIdsRef.current[statusId] = columnFetchId

      setColumnStates((prev) => ({
        ...prev,
        [statusId]: {
          ...(prev[statusId] ?? EMPTY_COLUMN_STATE),
          loading: true,
        },
      }))

      try {
        const query = buildColumnQuery(page)
        const response = sprintId
          ? await getSprintBoardColumnIssues(projectId, sprintId, statusId, query)
          : await getBoardColumnIssues(projectId, statusId, query)

        if (fetchGeneration !== fetchIdRef.current) return
        if (columnFetchId !== columnFetchIdsRef.current[statusId]) return

        const issues = mapApiIssuesToKanbanIssues(
          response.issues,
          projectId,
          statusId,
          columnMeta.isDoneStatus ?? false,
        )

        setColumnStates((prev) => {
          const current = prev[statusId] ?? EMPTY_COLUMN_STATE
          const mergedIssues = append
            ? mergeItemsById(current.issues, issues)
            : issues

          return {
            ...prev,
            [statusId]: {
              issues: mergedIssues,
              page: response.page,
              hasNext: response.has_next,
              loading: false,
              total: response.total,
            },
          }
        })

        const pages = loadedPagesRef.current[statusId] ?? []
        if (!pages.includes(page)) {
          loadedPagesRef.current[statusId] = [...pages, page].sort((a, b) => a - b)
        }
      } catch (err) {
        if (fetchGeneration !== fetchIdRef.current) return
        if (columnFetchId !== columnFetchIdsRef.current[statusId]) return

        const message =
          err instanceof ApiError ? err.message : 'Failed to load column issues.'
        setError(message)
        setColumnStates((prev) => ({
          ...prev,
          [statusId]: {
            ...(prev[statusId] ?? EMPTY_COLUMN_STATE),
            loading: false,
          },
        }))
      }
    },
    [buildColumnQuery, projectId, sprintId],
  )

  const loadInitialColumns = useCallback(
    async (columnMeta: KanbanColumn[], fetchGeneration: number) => {
      const visibleColumns = columnMeta.filter((column) => {
        return column.count > 0 || !filters || filters.statusId === 'all'
      })

      await Promise.all(
        visibleColumns.map((column) => {
          const statusId = column.statusId ?? column.id
          if (column.count === 0) {
            setColumnStates((prev) => ({
              ...prev,
              [statusId]: { ...EMPTY_COLUMN_STATE, total: 0 },
            }))
            return Promise.resolve()
          }
          return fetchColumnPage(statusId, 1, false, column, fetchGeneration)
        }),
      )
    },
    [fetchColumnPage, filters],
  )

  const loadBoardMetadata = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoading(false)
      return
    }

    const fetchGeneration = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const query = filters && searchParams
        ? boardColumnQueryFromFilters(filters, filterMetadata, searchParams, 1, 1)
        : undefined
      const board = sprintId
        ? await getSprintBoard(projectId, sprintId, query)
        : await getProjectKanban(projectId, query)

      if (fetchGeneration !== fetchIdRef.current) return

      const mappedColumns = mapKanbanBoardToColumns(board, projectId)
      setColumns(mappedColumns)
      setBoardFilters(board.filters ?? null)
      setHasActiveSprint(board.has_active_sprint ?? true)
      setSelectedSprint(board.selected_sprint ?? null)
      setColumnStates({})
      loadedPagesRef.current = {}
      columnFetchIdsRef.current = {}

      await loadInitialColumns(mappedColumns, fetchGeneration)
    } catch (err) {
      if (fetchGeneration !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to load kanban board.'
      setError(message)
      setColumns([])
      setColumnStates({})
      setBoardFilters(null)
      setHasActiveSprint(true)
      setSelectedSprint(null)
    } finally {
      if (fetchGeneration === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [
    projectId,
    sprintId,
    enabled,
    filters,
    filterMetadata,
    searchParams,
    loadInitialColumns,
  ])

  const refreshBoard = useCallback(async () => {
    if (!projectId || !enabled) return

    const fetchGeneration = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    const pagesByColumn = { ...loadedPagesRef.current }

    try {
      const query = filters && searchParams
        ? boardColumnQueryFromFilters(filters, filterMetadata, searchParams, 1, 1)
        : undefined
      const board = sprintId
        ? await getSprintBoard(projectId, sprintId, query)
        : await getProjectKanban(projectId, query)

      if (fetchGeneration !== fetchIdRef.current) return

      const mappedColumns = mapKanbanBoardToColumns(board, projectId)
      setColumns(mappedColumns)
      setBoardFilters(board.filters ?? null)
      setHasActiveSprint(board.has_active_sprint ?? true)
      setSelectedSprint(board.selected_sprint ?? null)

      const reloadTasks: Promise<void>[] = []
      for (const column of mappedColumns) {
        const statusId = column.statusId ?? column.id
        const pages = pagesByColumn[statusId]?.length
          ? pagesByColumn[statusId]
          : column.count > 0
            ? [1]
            : []

        if (pages.length === 0) {
          setColumnStates((prev) => ({
            ...prev,
            [statusId]: { ...EMPTY_COLUMN_STATE, total: 0 },
          }))
          continue
        }

        setColumnStates((prev) => ({
          ...prev,
          [statusId]: {
            ...(prev[statusId] ?? EMPTY_COLUMN_STATE),
            loading: true,
            total: column.count,
          },
        }))

        reloadTasks.push(
          (async () => {
            for (let index = 0; index < pages.length; index += 1) {
              await fetchColumnPage(
                statusId,
                pages[index],
                index > 0,
                column,
                fetchGeneration,
              )
            }
          })(),
        )
      }

      loadedPagesRef.current = pagesByColumn
      await Promise.all(reloadTasks)
    } catch (err) {
      if (fetchGeneration !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to refresh kanban board.'
      setError(message)
    } finally {
      if (fetchGeneration === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [
    projectId,
    sprintId,
    enabled,
    filters,
    filterMetadata,
    searchParams,
    fetchColumnPage,
  ])

  useEffect(() => {
    fetchIdRef.current += 1
    setColumns([])
    setColumnStates({})
    setBoardFilters(null)
    setHasActiveSprint(true)
    setSelectedSprint(null)
    setError(null)
    setLoading(true)
    loadedPagesRef.current = {}
    columnFetchIdsRef.current = {}
    void loadBoardMetadata()
  }, [loadBoardMetadata, filtersKey])

  useEffect(() => {
    return registerKanbanRefresh(() => {
      void refreshBoard()
    })
  }, [refreshBoard])

  const loadMoreColumn = useCallback(
    (statusId: string) => {
      const column = columns.find((item) => (item.statusId ?? item.id) === statusId)
      if (!column) return

      const state = columnStates[statusId] ?? EMPTY_COLUMN_STATE
      if (state.loading || !state.hasNext) return

      void fetchColumnPage(
        statusId,
        state.page + 1,
        true,
        column,
        fetchIdRef.current,
      )
    },
    [columns, columnStates, fetchColumnPage],
  )

  const moveIssueBetweenColumns = useCallback(
    (
      issueId: string,
      sourceStatusId: string,
      targetStatusId: string,
      issue?: KanbanIssue,
    ) => {
      setColumnStates((prev) => {
        const source = prev[sourceStatusId] ?? EMPTY_COLUMN_STATE
        const target = prev[targetStatusId] ?? EMPTY_COLUMN_STATE
        const movedIssue =
          issue ?? source.issues.find((item) => item.id === issueId)

        if (!movedIssue) return prev

        const nextIssue = { ...movedIssue, statusId: targetStatusId }

        return {
          ...prev,
          [sourceStatusId]: {
            ...source,
            issues: source.issues.filter((item) => item.id !== issueId),
            total: Math.max(0, source.total - 1),
          },
          [targetStatusId]: {
            ...target,
            issues: mergeItemsById([nextIssue], target.issues),
            total: target.total + 1,
          },
        }
      })

      setColumns((prev) =>
        prev.map((column) => {
          const statusId = column.statusId ?? column.id
          if (statusId === sourceStatusId) {
            const nextWip = column.wipCount != null ? Math.max(0, column.wipCount - 1) : undefined
            return {
              ...column,
              count: Math.max(0, column.count - 1),
              wipCount: nextWip,
            }
          }
          if (statusId === targetStatusId) {
            const nextWip = column.wipCount != null ? column.wipCount + 1 : undefined
            return {
              ...column,
              count: column.count + 1,
              wipCount: nextWip,
            }
          }
          return column
        }),
      )
    },
    [],
  )

  const rollbackIssueMove = useCallback(
    (
      issueId: string,
      sourceStatusId: string,
      targetStatusId: string,
      issue: KanbanIssue,
    ) => {
      moveIssueBetweenColumns(issueId, targetStatusId, sourceStatusId, issue)
    },
    [moveIssueBetweenColumns],
  )

  const mergedColumns = useMemo(
    () =>
      columns.map((column) => {
        const statusId = column.statusId ?? column.id
        const state = columnStates[statusId] ?? EMPTY_COLUMN_STATE
        return {
          ...column,
          issues: state.issues,
          count: column.count,
          pagination: {
            page: state.page,
            hasNext: state.hasNext,
            loading: state.loading,
            total: state.total,
          },
        }
      }),
    [columns, columnStates],
  )

  const totalIssues = useMemo(
    () => columns.reduce((sum, column) => sum + column.count, 0),
    [columns],
  )

  return {
    columns: mergedColumns,
    boardFilters,
    hasActiveSprint,
    selectedSprint,
    loading,
    error,
    totalIssues,
    refreshBoard,
    loadMoreColumn,
    moveIssueBetweenColumns,
    rollbackIssueMove,
  }
}

export type KanbanColumnWithPagination = KanbanColumn & {
  pagination?: {
    page: number
    hasNext: boolean
    loading: boolean
    total: number
  }
}
