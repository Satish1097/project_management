import { Link } from 'react-router-dom'
import { Kanban, Timer } from 'lucide-react'
import { ROUTES, sprintBoardPath } from '@/constants/routes'
import type { DashboardActiveSprintContextApi } from '@/types/dashboard'
import { DashboardWidget } from './DashboardWidget'

type ActiveSprintWidgetProps = {
  data: DashboardActiveSprintContextApi | null
  loading: boolean
  error: string | null
}

export function ActiveSprintWidget({ data, loading, error }: ActiveSprintWidgetProps) {
  const sprint = data?.sprint
  const project = data?.project

  return (
    <DashboardWidget
      title="Active Sprint"
      icon={<Timer className="size-4 text-devflow-primary" />}
      viewAllTo={project && sprint ? sprintBoardPath(project.id, sprint.id) : ROUTES.sprints}
      action={
        project && sprint ? (
          <Link
            to={sprintBoardPath(project.id, sprint.id)}
            className="inline-flex items-center gap-1 rounded-md border border-devflow-border px-2 py-1 text-caption font-medium text-devflow-text hover:bg-devflow-muted"
          >
            <Kanban className="size-3.5" />
            Open board
          </Link>
        ) : null
      }
    >
      {loading ? (
        <div className="space-y-3">
          <div className="h-5 w-2/3 animate-pulse rounded bg-devflow-table-header" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-devflow-table-header" />
          <div className="h-1.5 animate-pulse rounded bg-devflow-table-header" />
        </div>
      ) : error ? (
        <p className="text-caption text-devflow-error">{error}</p>
      ) : !data || !sprint || !project ? (
        <div className="text-center">
          <p className="text-body text-devflow-text-secondary">No active sprint</p>
          <Link
            to={ROUTES.sprints}
            className="mt-2 inline-block text-caption font-medium text-devflow-primary hover:underline"
          >
            View sprints
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-body font-medium text-devflow-text">{sprint.name}</p>
              <p className="mt-1 truncate text-caption text-devflow-text-muted">{project.name}</p>
            </div>
            <span className="shrink-0 text-body font-semibold tabular-nums text-devflow-text">
              {sprint.progress_percentage}%
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-devflow-table-header">
            <div
              className="h-full rounded-full bg-devflow-primary transition-all"
              style={{ width: `${sprint.progress_percentage}%` }}
            />
          </div>

          <div className="flex items-center gap-4 text-caption text-devflow-text-muted">
            <span>
              <span className="font-semibold text-devflow-text">{sprint.completed_issues}</span>{' '}
              done
            </span>
            <span>
              <span className="font-semibold text-devflow-text">{sprint.remaining_issues}</span>{' '}
              remaining
            </span>
          </div>
        </div>
      )}
    </DashboardWidget>
  )
}
