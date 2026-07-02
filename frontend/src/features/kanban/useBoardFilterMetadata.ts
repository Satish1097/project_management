import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getKanbanBoardFilters,
  type KanbanBoardFiltersApi,
} from '@/api/issues'
import { ApiError } from '@/api/types'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import type { KanbanBoardFilterMetadata } from '@/types/kanban'

type UseBoardFilterMetadataOptions = {
  enabled?: boolean
  embeddedFilters?: KanbanBoardFiltersApi | null
}

function toMetadata(filters: KanbanBoardFiltersApi): KanbanBoardFilterMetadata {
  return {
    assignees: filters.assignees,
    statuses: filters.statuses.map((status) => ({
      id: status.id,
      slug: status.slug,
      name: status.name,
      color: status.color,
    })),
    labels: filters.labels,
    priorities: filters.priorities,
  }
}

export function useBoardFilterMetadata(
  projectId: string,
  options: UseBoardFilterMetadataOptions = {},
) {
  const { enabled = true, embeddedFilters = null } = options
  const [metadata, setMetadata] = useState<KanbanBoardFilterMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cachedProjectId = useRef<string | null>(null)

  const applyFilters = useCallback((filters: KanbanBoardFiltersApi) => {
    setMetadata(toMetadata(filters))
    cachedProjectId.current = projectId
    setError(null)
  }, [projectId])

  const loadFilters = useCallback(async () => {
    if (!projectId || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const filters = await getKanbanBoardFilters(projectId)
      applyFilters(filters)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load board filters.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [applyFilters, enabled, projectId])

  useEffect(() => {
    if (!enabled || !projectId) return

    if (embeddedFilters) {
      applyFilters(embeddedFilters)
      return
    }

    if (cachedProjectId.current === projectId && metadata) return

    void loadFilters()
  }, [applyFilters, embeddedFilters, enabled, loadFilters, metadata, projectId])

  useEffect(() => {
    if (!enabled || !projectId) return

    return registerKanbanRefresh(() => {
      if (embeddedFilters) return
      void loadFilters()
    })
  }, [embeddedFilters, enabled, loadFilters, projectId])

  return {
    metadata,
    loading,
    error,
    refreshFilterMetadata: loadFilters,
  }
}
