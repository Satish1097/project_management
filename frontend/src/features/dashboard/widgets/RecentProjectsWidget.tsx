import { Link } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { ROUTES, projectOverviewPath } from '@/constants/routes'
import type { DashboardProjectApi } from '@/types/dashboard'
import { DashboardWidget } from './DashboardWidget'

type RecentProjectsWidgetProps = {
  projects: DashboardProjectApi[] | null
  loading: boolean
  error: string | null
}

const PREVIEW_LIMIT = 5

export function RecentProjectsWidget({
  projects,
  loading,
  error,
}: RecentProjectsWidgetProps) {
  const recent = projects?.slice(0, PREVIEW_LIMIT) ?? []

  return (
    <DashboardWidget
      title="Projects"
      icon={<FolderKanban className="size-4 text-devflow-text-secondary" />}
      viewAllTo={ROUTES.projects}
    >
      {error ? (
        <p className="text-caption text-devflow-error">{error}</p>
      ) : loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="space-y-1.5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-devflow-table-header" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-devflow-table-header" />
            </li>
          ))}
        </ul>
      ) : recent.length === 0 ? (
        <p className="text-body text-devflow-text-secondary">No projects yet</p>
      ) : (
        <ul className="divide-y divide-[var(--df-border-faint)]">
          {recent.map((project) => (
            <li key={project.id}>
              <Link
                to={projectOverviewPath(project.id)}
                className="block py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
              >
                <p className="truncate text-body font-medium text-devflow-text">{project.name}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-caption text-devflow-text-muted">
                  <span className="truncate font-mono">{project.key}</span>
                  <span className="shrink-0 tabular-nums">{project.open_issue_count} open</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  )
}
