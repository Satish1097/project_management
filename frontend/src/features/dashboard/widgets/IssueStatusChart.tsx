import { PieChart } from 'lucide-react'
import type { DashboardIssueStatusItemApi } from '@/types/dashboard'
import { cn } from '@/utils/cn'
import { DashboardWidget } from './DashboardWidget'

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-devflow-text-muted',
  in_progress: 'bg-devflow-primary',
  done: 'bg-devflow-success',
}

type IssueStatusChartProps = {
  data: DashboardIssueStatusItemApi[] | null
  loading: boolean
  error: string | null
}

export function IssueStatusChart({ data, loading, error }: IssueStatusChartProps) {
  const total = data?.reduce((sum, item) => sum + item.count, 0) ?? 0

  return (
    <DashboardWidget
      title="Issue Status"
      icon={<PieChart className="size-3.5 text-devflow-text-secondary" />}
      className="min-h-[11.5rem]"
    >
      {loading ? (
        <div className="space-y-2">
          <div className="h-3 animate-pulse rounded bg-devflow-table-header" />
          <div className="h-3 animate-pulse rounded bg-devflow-table-header" />
          <div className="h-3 animate-pulse rounded bg-devflow-table-header" />
        </div>
      ) : error ? (
        <p className="text-caption text-devflow-error">{error}</p>
      ) : !data || data.length === 0 || total === 0 ? (
        <p className="text-caption text-devflow-text-secondary">No open issues</p>
      ) : (
        <div className="space-y-2.5">
          <div className="flex h-2 overflow-hidden rounded-full bg-devflow-table-header">
            {data.map((item) => (
              <div
                key={item.category}
                className={cn(
                  'h-full transition-all',
                  STATUS_COLORS[item.category] ?? 'bg-devflow-brand',
                )}
                style={{ width: `${(item.count / total) * 100}%` }}
                title={`${item.label}: ${item.count}`}
              />
            ))}
          </div>

          <ul className="space-y-2">
            {data.map((item) => (
              <li
                key={item.category}
                className="flex items-center justify-between gap-2 text-body"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-devflow-text-secondary">
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
                      STATUS_COLORS[item.category] ?? 'bg-devflow-brand',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-devflow-text">
                  {item.count}
                  <span className="ml-1 font-normal text-devflow-text-muted">
                    ({Math.round((item.count / total) * 100)}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardWidget>
  )
}
