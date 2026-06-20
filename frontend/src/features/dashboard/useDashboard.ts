import { useCallback, useEffect, useState } from 'react'
import { getWorkspaceDashboard } from '@/api/dashboard'
import { useAppContext } from '@/features/context/useAppContext'
import type { WorkspaceDashboardApi } from '@/types/dashboard'

export function useDashboard() {
  const { currentOrganization } = useAppContext()
  const organizationId = currentOrganization?.id ?? null

  const [data, setData] = useState<WorkspaceDashboardApi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!organizationId) {
      setData(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      setData(await getWorkspaceDashboard(organizationId))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace overview')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    void load()
  }, [load])

  return {
    summary: data?.summary ?? null,
    projects: data?.projects ?? null,
    tasks: data?.tasks ?? null,
    activities: data?.activities ?? null,
    activeSprints: data?.activeSprints ?? null,
    loading,
    error,
    refresh: load,
    organizationId,
  }
}
