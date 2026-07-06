import { History } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import type { DashboardActivityApi } from '@/types/dashboard'
import { DashboardWidget } from './DashboardWidget'

type RecentActivityWidgetProps = {
  activities: DashboardActivityApi[] | null
  loading: boolean
  error: string | null
}

const PREVIEW_LIMIT = 5

export function RecentActivityWidget({
  activities,
  loading,
  error,
}: RecentActivityWidgetProps) {
  const preview = activities?.slice(0, PREVIEW_LIMIT) ?? null

  return (
    <DashboardWidget
      title="Recent Activity"
      icon={<History className="size-4 text-devflow-text-secondary" />}
      viewAllTo={ROUTES.workspaceActivity}
    >
      <ActivityFeed
        embedded
        variant="preview"
        activities={preview}
        isLoading={loading}
        error={error}
        emptyMessage="No recent activity"
        emptyHelperText=""
        showProjectName
      />
    </DashboardWidget>
  )
}
