import { Link } from 'react-router-dom'
import { Timer } from 'lucide-react'
import { ROUTES, sprintBoardPath } from '@/constants/routes'
import type { DashboardActiveSprintContextApi } from '@/types/dashboard'
import { DashboardWidget } from './DashboardWidget'

type ActiveSprintsWidgetProps = {
  sprints: DashboardActiveSprintContextApi[] | null
  loading: boolean
  error: string | null
}

const PREVIEW_LIMIT = 5

export function ActiveSprintsWidget({ sprints, loading, error }: ActiveSprintsWidgetProps) {
  const items = (sprints ?? []).slice(0, PREVIEW_LIMIT)

  return (
    <DashboardWidget
      title="Active Sprints"
      icon={<Timer className="size-4 text-devflow-primary" />}
      viewAllTo={ROUTES.sprints}
    >
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="space-y-1.5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-devflow-table-header" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-devflow-table-header" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="text-caption text-devflow-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-body text-devflow-text-secondary">No active sprints</p>
      ) : (
        <ul className="divide-y divide-[var(--df-border-faint)]">
          {items.map(({ project, sprint }) => (
            <li key={sprint.id}>
              <Link
                to={sprintBoardPath(project.id, sprint.id)}
                className="block py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-devflow-text">
                      {sprint.name}
                    </p>
                    <p className="mt-1 truncate text-caption text-devflow-text-muted">
                      {project.name}
                    </p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-caption tabular-nums text-devflow-text-muted">
                    {sprint.remaining_issues} remaining
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  )
}
