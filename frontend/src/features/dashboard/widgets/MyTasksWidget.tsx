import { Link } from 'react-router-dom'
import { CheckSquare } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { DashboardAssignedTaskApi } from '@/types/dashboard'
import { DashboardWidget } from './DashboardWidget'

type MyTasksWidgetProps = {
  tasks: DashboardAssignedTaskApi[] | null
  loading: boolean
  error: string | null
}

const PREVIEW_LIMIT = 5

export function MyTasksWidget({ tasks, loading, error }: MyTasksWidgetProps) {
  const preview = tasks?.slice(0, PREVIEW_LIMIT) ?? []

  return (
    <DashboardWidget
      title="My Tasks"
      icon={<CheckSquare className="size-4 text-devflow-text-secondary" />}
      viewAllTo={ROUTES.myTasks}
    >
      {error ? (
        <p className="text-caption text-devflow-error">{error}</p>
      ) : loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="space-y-1.5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-devflow-table-header" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-devflow-table-header" />
            </li>
          ))}
        </ul>
      ) : preview.length === 0 ? (
        <p className="text-body text-devflow-text-secondary">No assigned tasks</p>
      ) : (
        <ul className="divide-y divide-[var(--df-border-faint)]">
          {preview.map((task) => (
            <li key={task.id}>
              <Link
                to={ROUTES.myTasks}
                className="block py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <p className="truncate text-body font-medium text-devflow-text">{task.title}</p>
                <div className="mt-1 flex items-center gap-2 text-caption text-devflow-text-muted">
                  <span className="font-mono">{task.key}</span>
                  <span aria-hidden="true">·</span>
                  <span>{task.status.name}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  )
}
