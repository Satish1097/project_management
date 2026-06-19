import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

import { getProjectActivity, type ProjectActivityPageApi } from '@/api/projects'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { getProjectById } from '@/services/projectData'

const PAGE_SIZE = 20

export function ProjectActivityPage() {
  const { projectId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const project = getProjectById(projectId)
  const [activityPage, setActivityPage] = useState<ProjectActivityPageApi | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  const page = useMemo(() => {
    const parsed = Number(searchParams.get('page') ?? '1')
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
  }, [searchParams])

  const loadActivity = useCallback(async () => {
    if (!projectId) return

    setActivityLoading(true)
    setActivityError(null)
    try {
      const data = await getProjectActivity(projectId, {
        page,
        pageSize: PAGE_SIZE,
      })
      setActivityPage(data)
    } catch (err: unknown) {
      setActivityError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [page, projectId])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {})
    },
    [setSearchParams],
  )

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  return (
    <main className="page-main">
      <ActivityFeed
        variant="full"
        activities={activityPage?.results ?? null}
        isLoading={activityLoading}
        error={activityError}
        onRetry={loadActivity}
        emptyMessage="No activity recorded yet"
        pagination={
          activityPage
            ? {
                count: activityPage.count,
                next: activityPage.next,
                previous: activityPage.previous,
                page,
                pageSize: PAGE_SIZE,
                onPageChange: handlePageChange,
              }
            : undefined
        }
      />
    </main>
  )
}
