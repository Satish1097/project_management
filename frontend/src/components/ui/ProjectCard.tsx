import { Globe, Server, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge'
import type { Project, ProjectMember } from '@/types/projects'
import { cn } from '@/utils/cn'

const icons = {
  mobile: Smartphone,
  web: Globe,
  api: Server,
} as const

type ProjectCardProps = {
  project: Project
  to: string
  activeSprintName?: string
  activeSprintStatus?: string
  memberCount?: number
  membersLoading?: boolean
  avatarMembers?: ProjectMember[]
  avatarExtra?: number
  viewMode?: 'grid' | 'list'
}

export function ProjectCard({
  project,
  to,
  activeSprintName,
  activeSprintStatus,
  memberCount,
  membersLoading = false,
  avatarMembers = [],
  avatarExtra,
  viewMode = 'grid',
}: ProjectCardProps) {
  const Icon = icons[project.icon]
  const issuesLabel = project.openIssuesLabel ?? project.issuesLabel
  const memberLabel = membersLoading
    ? 'Loading members…'
    : `${memberCount ?? 0} ${memberCount === 1 ? 'Member' : 'Members'}`
  const showProgress =
    project.progress !== undefined &&
    (project.status === 'active' || project.status === 'at_risk')

  return (
    <Link
      to={to}
      className={cn(
        'group flex rounded-lg border border-devflow-border bg-devflow-card shadow-devflow-sm transition-all duration-200',
        'hover:-translate-y-px hover:border-devflow-border/80 hover:shadow-devflow-md',
        'active:translate-y-0 active:shadow-devflow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/30 focus-visible:ring-offset-1 focus-visible:ring-offset-devflow-card',
        viewMode === 'list'
          ? 'flex-row items-center gap-4 p-4'
          : 'flex-col gap-3 p-4',
      )}
    >
      <div
        className={cn(
          'flex min-w-0',
          viewMode === 'list' ? 'flex-1 items-center gap-4' : 'flex-col gap-2.5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--df-nav-tint)] text-devflow-primary transition-colors group-hover:bg-[var(--df-nav-tint-soft)]">
              <Icon className="size-[18px]" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-section-title text-devflow-text">
                  {project.name}
                </h3>
                <ProjectStatusBadge status={project.status} size="sm" />
              </div>
              <p
                className={cn(
                  'mt-1 text-body text-devflow-text-secondary',
                  viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1',
                )}
              >
                {project.description}
              </p>
            </div>
          </div>
        </div>

        {activeSprintName && (
          <p className="text-caption text-devflow-text-secondary">
            <span className="font-medium text-devflow-text">
              {activeSprintName}
            </span>
            {activeSprintStatus && (
              <>
                <span className="text-devflow-text-muted"> • </span>
                <span className="text-devflow-success">{activeSprintStatus}</span>
              </>
            )}
          </p>
        )}

        {showProgress && (
          <div className={cn(viewMode === 'list' && 'hidden sm:block sm:max-w-[140px]')}>
            <div className="h-1 overflow-hidden rounded-full bg-devflow-table-header">
              <div
                className="h-full rounded-full bg-devflow-success transition-[width] duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        )}

        <div
          className={cn(
            'flex items-center justify-between gap-3',
            viewMode === 'grid' &&
              'border-t border-[var(--df-border-faint)] pt-3',
          )}
        >
          <p className="text-caption text-devflow-text-secondary">
            <span
              className={cn(
                project.issuesCritical && 'font-medium text-devflow-error',
              )}
            >
              {issuesLabel}
            </span>
            <span className="text-devflow-text-muted"> • </span>
            <span>{memberLabel}</span>
          </p>
          <AvatarGroup members={avatarMembers} extra={avatarExtra} projectId={project.id} />
        </div>

        {project.recentActivity && viewMode === 'grid' && (
          <p className="-mt-1 truncate text-[11px] text-devflow-text-muted">
            {project.recentActivity}
          </p>
        )}
      </div>
    </Link>
  )
}
