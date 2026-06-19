import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getProjectReportSummary } from '@/api/projects'
import { ApiError } from '@/api/types'
import { buildIssueCountLabels } from '@/services/mapProjectApi'
import {
  getProjectByIdFromRegistry,
  upsertProjectInRegistry,
} from '@/services/projectsRegistry'

export type ProjectIssueStats = {
  totalIssues: number
  openIssues: number
  doneIssues: number
}

export function useProjectIssueStats(projectId: string) {
  const { pathname } = useLocation()
  const [stats, setStats] = useState<ProjectIssueStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const report = await getProjectReportSummary(projectId)
      const nextStats: ProjectIssueStats = {
        totalIssues: report.total_issues,
        openIssues: report.open_issues,
        doneIssues: report.done_issues,
      }
      setStats(nextStats)

      const existing = getProjectByIdFromRegistry(projectId)
      if (existing) {
        upsertProjectInRegistry({
          ...existing,
          ...buildIssueCountLabels(report.open_issues),
        })
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load project stats.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void refresh()
  }, [refresh, pathname])

  return { stats, loading, error, refresh }
}
