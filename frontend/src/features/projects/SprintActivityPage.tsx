import { useCallback, useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { getSprintActivity } from '@/api/sprints'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { getProjectById, getSprintById } from '@/services/projectData'
import type { DashboardActivityApi } from '@/types/dashboard'

export function SprintActivityPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)

  const [activities, setActivities] = useState<DashboardActivityApi[] | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  const loadActivity = useCallback(async () => {
    if (!projectId || !sprintId) return

    setActivityLoading(true)
    setActivityError(null)
    try {
      const items = await getSprintActivity(projectId, sprintId)
      setActivities(items)
    } catch (err: unknown) {
      setActivityError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [projectId, sprintId])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <main className="page-main p-3">
      <ActivityFeed
        activities={activities}
        isLoading={activityLoading}
        error={activityError}
        onRetry={loadActivity}
      />
    </main>
  )
}
