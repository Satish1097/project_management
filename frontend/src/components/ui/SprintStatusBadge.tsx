import type { SprintStatus } from '@/types/sprints'
import { formatSprintStatusLabel } from '@/services/projectData'
import { cn } from '@/utils/cn'

const styles: Record<SprintStatus, string> = {
  active: 'bg-[var(--df-success-tint)] text-devflow-success',
  planned: 'bg-devflow-pill text-devflow-text-secondary',
  completed: 'bg-devflow-muted text-devflow-text-secondary',
  cancelled: 'bg-devflow-danger-bg text-devflow-danger-text',
  paused: 'bg-devflow-warning-bg text-devflow-warning',
}

type SprintStatusBadgeProps = {
  status: SprintStatus
  className?: string
}

export function SprintStatusBadge({ status, className }: SprintStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded px-2 py-0.5 text-caption-label font-medium',
        styles[status],
        className,
      )}
    >
      {formatSprintStatusLabel(status)}
    </span>
  )
}
