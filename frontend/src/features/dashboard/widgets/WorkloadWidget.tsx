import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import type { DashboardWorkloadApi } from '@/types/dashboard'
import { cn } from '@/utils/cn'
import { DashboardWidget } from './DashboardWidget'

type WorkloadWidgetProps = {
  workload: DashboardWorkloadApi | null
  loading: boolean
  error: string | null
}

export function WorkloadWidget({ workload, loading, error }: WorkloadWidgetProps) {
  return (
    <DashboardWidget
      title="My Workload"
      icon={<Briefcase className="size-3.5 text-devflow-text-secondary" />}
      viewAllTo={ROUTES.myTasks}
    >
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-devflow-table-header" />
          ))}
        </div>
      ) : error ? (
        <p className="text-caption text-devflow-error">{error}</p>
      ) : !workload ? (
        <p className="text-caption text-devflow-text-secondary">No workload data</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <WorkloadStat label="Assigned" value={workload.total_assigned} />
            <WorkloadStat
              label="Overdue"
              value={workload.overdue}
              tone={workload.overdue > 0 ? 'danger' : 'default'}
            />
            <WorkloadStat label="Due soon" value={workload.due_soon} tone="warning" />
            <WorkloadStat
              label="High priority"
              value={workload.high_priority}
              tone={workload.high_priority > 0 ? 'warning' : 'default'}
            />
          </div>

          {workload.by_status_category.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {workload.by_status_category.map((item) => (
                <span
                  key={item.category}
                  className="rounded-full bg-devflow-muted px-2 py-0.5 text-caption text-devflow-text-muted"
                >
                  {item.label}: {item.count}
                </span>
              ))}
            </div>
          ) : null}

          {workload.by_priority.some((item) => item.count > 0) ? (
            <Link
              to={ROUTES.myTasks}
              className="block text-caption font-medium text-devflow-primary hover:underline"
            >
              View all assigned work →
            </Link>
          ) : null}
        </div>
      )}
    </DashboardWidget>
  )
}

function WorkloadStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'warning' | 'danger'
}) {
  return (
    <div
      className={cn(
        'rounded-md border border-devflow-border px-2 py-1.5',
        tone === 'warning' && value > 0 && 'border-devflow-warning/30 bg-devflow-warning-bg/40',
        tone === 'danger' && value > 0 && 'border-devflow-error/30 bg-devflow-danger-bg/40',
      )}
    >
      <p className="text-caption text-devflow-text-muted">{label}</p>
      <p className="text-metric tabular-nums text-devflow-text">{value}</p>
    </div>
  )
}
