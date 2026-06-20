import { useCallback, useEffect, useState } from 'react'

import { TopHeader } from '@/components/layout/TopHeader'

import { getWorkspaceDashboardActivity } from '@/api/dashboard'

import { useAppContext } from '@/features/context/useAppContext'

import type { DashboardActivityApi } from '@/types/dashboard'

import { ActivityFeed } from './ActivityFeed'



const ACTIVITY_LIMIT = 100



export function WorkspaceActivityPage() {

  const { currentOrganization } = useAppContext()

  const organizationId = currentOrganization?.id ?? null

  const [activities, setActivities] = useState<DashboardActivityApi[] | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)



  const loadActivity = useCallback(async () => {

    if (!organizationId) {

      setActivities(null)

      setError(null)

      return

    }



    setIsLoading(true)

    setError(null)

    try {

      setActivities(await getWorkspaceDashboardActivity(organizationId, ACTIVITY_LIMIT))

    } catch (err: unknown) {

      setError(err instanceof Error ? err.message : 'Failed to load activity')

    } finally {

      setIsLoading(false)

    }

  }, [organizationId])



  useEffect(() => {

    void loadActivity()

  }, [loadActivity])



  return (

    <>

      <TopHeader variant="projects" activeTab="Board" />

      <main className="page-main">

        <ActivityFeed

          variant="full"

          activities={activities}

          isLoading={isLoading}

          error={error}

          onRetry={loadActivity}

          emptyMessage="No recent activity"

          emptyHelperText="Activity will appear here when issues, comments, sprint changes, or status updates occur in this workspace."

        />

      </main>

    </>

  )

}


