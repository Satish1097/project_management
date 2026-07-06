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
  const fetchIdRef = useRef(0)

  useEffect(() => {
    if (cachedProjectId.current === projectId) return
    cachedProjectId.current = null
    setMetadata(null)
    setError(null)
  }, [projectId])

  const applyFilters = useCallback((filters: KanbanBoardFiltersApi) => {
    setMetadata(toMetadata(filters))
    cachedProjectId.current = projectId
    setError(null)
  }, [projectId])

  const loadFilters = useCallback(async () => {
    if (!projectId || !enabled) return

    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const filters = await getKanbanBoardFilters(projectId)
      if (fetchId !== fetchIdRef.current) return
      applyFilters(filters)
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to load board filters.'
      setError(message)
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [applyFilters, enabled, projectId])

  useEffect(() => {
    if (!enabled || !projectId) return

    // Only apply embeddedFilters when the cache is valid for this project.
    // When cachedProjectId is null the project just changed: embeddedFilters
    // may be from the previous project (stale state from the render before
    // the useProjectKanban reset fired). Applying stale filters here would
    // poison the cache — setting cachedProjectId to the NEW project id with
    // the OLD project's filter data — so subsequent renders short-circuit the
    // cache check and loadFilters() for the new project is never called.
    if (embeddedFilters && cachedProjectId.current !== null) {
      applyFilters(embeddedFilters)
      return
    }

    if (cachedProjectId.current === projectId) return

    void loadFilters()
  }, [applyFilters, embeddedFilters, enabled, loadFilters, projectId])

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
