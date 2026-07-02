import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProjectKanban } from '@/api/issues'
import { getSprintBoard } from '@/api/sprints'
import { ApiError } from '@/api/types'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import { mapKanbanBoardToColumns } from '@/services/mapKanbanApi'
import type { KanbanColumn } from '@/types/kanban'
import type { KanbanBoardFiltersApi } from '@/api/issues'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  const loadBoard = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoading(false)
      return
    }
    if (sprintId && !UUID_RE.test(sprintId)) return

    setLoading(true)
    setError(null)

    try {
      const board = sprintId
        ? await getSprintBoard(projectId, sprintId)
        : await getProjectKanban(projectId)
      setColumns(mapKanbanBoardToColumns(board, projectId))
      setBoardFilters(board.filters ?? null)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load kanban board.'
      setError(message)
      setColumns([])
      setBoardFilters(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, sprintId, enabled])

  useEffect(() => {
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
