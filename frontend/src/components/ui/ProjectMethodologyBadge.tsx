import type { ProjectMethodology } from '@/types/projects'
import { cn } from '@/utils/cn'

const config: Record<
  ProjectMethodology,
  { label: string; className: string }
> = {
  scrum: {
    label: 'Scrum',
    className: 'bg-[var(--df-brand-tint)] text-devflow-brand',
  },
  kanban: {
    label: 'Kanban',
    className: 'bg-[var(--df-nav-tint)] text-devflow-primary',
  },
}

type ProjectMethodologyBadgeProps = {
  methodology: ProjectMethodology
  size?: 'default' | 'sm'
}

export function ProjectMethodologyBadge({
  methodology,
  size = 'sm',
}: ProjectMethodologyBadgeProps) {
  const item = config[methodology]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded border border-transparent font-medium leading-none',
        size === 'sm'
          ? 'px-1.5 py-0.5 text-[10px] tracking-wide'
          : 'px-2 py-0.5 text-[11px] tracking-wide',
        item.className,
      )}
    >
      {item.label}
    </span>
  )
}
