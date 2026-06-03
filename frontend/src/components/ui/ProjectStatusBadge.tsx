import type { ProjectStatus } from '@/types/projects'
import { cn } from '@/utils/cn'

const styles: Record<ProjectStatus, string> = {
  active: 'text-[#15803d]',
  planning: 'bg-[rgba(208,225,251,0.3)] text-[#505f76]',
  at_risk: 'bg-[rgba(255,218,214,0.3)] text-[#ba1a1a]',
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
