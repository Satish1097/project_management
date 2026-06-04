import type { ProjectStatus } from '@/types/projects'
import { cn } from '@/utils/cn'

const styles: Record<ProjectStatus, string> = {
  active: 'bg-[var(--df-success-tint)] text-devflow-success',
  planning:
    'bg-[var(--df-nav-tint-soft)] text-[var(--df-status-dot-neutral)]',
  at_risk: 'bg-[var(--df-danger-tint)] text-devflow-error',
  archived: 'bg-devflow-muted text-devflow-text-muted',
}

const labels: Record<ProjectStatus, string> = {
  active: 'Active',
  planning: 'Planning',
  at_risk: 'At risk',
  archived: 'Archived',
}

type ProjectStatusBadgeProps = {
  status: ProjectStatus
  size?: 'default' | 'sm'
}

export function ProjectStatusBadge({
  status,
  size = 'default',
}: ProjectStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded border border-transparent font-medium leading-none',
        status === 'archived' && 'border-devflow-border',
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[10px] tracking-wide'
          : 'px-2 py-0.5 text-[11px] tracking-wide',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  )
}
