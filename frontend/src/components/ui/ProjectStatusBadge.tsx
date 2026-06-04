import type { ProjectStatus } from '@/types/projects'
import { cn } from '@/utils/cn'

const styles: Record<ProjectStatus, string> = {
  active: 'text-devflow-success',
  planning: 'bg-[var(--df-nav-tint-soft)] text-[var(--df-status-dot-neutral)]',
  at_risk: 'bg-[var(--df-danger-tint)] text-devflow-error',
}

const labels: Record<ProjectStatus, string> = {
  active: 'ACTIVE',
  planning: 'PLANNING',
  at_risk: 'AT RISK',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 text-caption-label uppercase leading-4 tracking-[0.6px]',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  )
}
