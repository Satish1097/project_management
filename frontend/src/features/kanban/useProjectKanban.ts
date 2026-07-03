import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getProjectKanban } from '@/api/issues'
import { getSprintBoard } from '@/api/sprints'
import { ApiError } from '@/api/types'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import { mapKanbanBoardToColumns } from '@/services/mapKanbanApi'
import type { KanbanColumn } from '@/types/kanban'
import type { KanbanBoardFiltersApi } from '@/api/issues'

type UseProjectKanbanOptions = {
  sprintId?: string
  enabled?: boolean
}

export function useProjectKanban(
  projectId: string,
  options: UseProjectKanbanOptions = {},
) {
  const { sprintId, enabled = true } = options
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [boardFilters, setBoardFilters] = useState<KanbanBoardFiltersApi | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const loadBoard = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const board = sprintId
        ? await getSprintBoard(projectId, sprintId)
        : await getProjectKanban(projectId)
      if (fetchId !== fetchIdRef.current) return

      setColumns(mapKanbanBoardToColumns(board, projectId))
      setBoardFilters(board.filters ?? null)
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to load kanban board.'
      setError(message)
      setColumns([])
      setBoardFilters(null)
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [projectId, sprintId, enabled])

  useEffect(() => {
    fetchIdRef.current += 1
    setColumns([])
    setBoardFilters(null)
    setError(null)
    setLoading(true)
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    return registerKanbanRefresh(() => {
      void loadBoard()
    })
  }, [loadBoard])

  const totalIssues = useMemo(
    () => columns.reduce((sum, column) => sum + column.issues.length, 0),
    [columns],
  )

  return {
    columns,
    boardFilters,
    loading,
    error,
    totalIssues,
    refreshBoard: loadBoard,
  }
}
