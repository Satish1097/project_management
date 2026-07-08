import { CheckSquare, CircleDot, FolderKanban, Timer } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ROUTES } from '@/constants/routes'
import type { DashboardSummaryApi } from '@/types/dashboard'

type DashboardKpiCardsProps = {
  summary: DashboardSummaryApi | null
  loading: boolean
}

const kpiConfig = [
  {
    key: 'projects' as const,
    label: 'Projects',
    to: ROUTES.projects,
    icon: FolderKanban,
    value: (s: DashboardSummaryApi) => String(s.visible_project_count),
  },
  {
    key: 'openIssues' as const,
    label: 'Open Issues',
    to: ROUTES.search,
    icon: CircleDot,
    value: (s: DashboardSummaryApi) => String(s.open_issue_count),
  },
  {
    key: 'activeSprint' as const,
    label: 'Active Sprints (Scrum)',
    to: ROUTES.sprints,
    icon: Timer,
    value: (s: DashboardSummaryApi) => String(s.active_sprint_count),
  },
  {
    key: 'myTasks' as const,
    label: 'My Tasks',
    to: ROUTES.myTasks,
    icon: CheckSquare,
    value: (s: DashboardSummaryApi) => String(s.assigned_to_me_count),
  },
]

export function DashboardKpiCards({ summary, loading }: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {kpiConfig.map((kpi) => {
        const Icon = kpi.icon
        return (
          <MetricCard
            key={kpi.key}
            label={kpi.label}
            value={loading || !summary ? '—' : kpi.value(summary)}
            icon={
              <Icon className="size-4 shrink-0 text-devflow-text-muted" strokeWidth={1.75} />
            }
            to={kpi.to}
            className="!p-3"
          />
        )
      })}
    </div>
  )
}
