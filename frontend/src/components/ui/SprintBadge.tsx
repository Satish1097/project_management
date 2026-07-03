import { cn } from '@/utils/cn'

type SprintBadgeProps = {
  name: string | null
  className?: string
}

export function SprintBadge({ name, className }: SprintBadgeProps) {
  const label = name ?? 'Backlog'

  return (
    <span
      title={label}
      className={cn(
        'inline-block max-w-full truncate rounded px-2 py-0.5 text-caption-label',
        'bg-devflow-pill text-devflow-text-muted',
        className,
      )}
    >
      {label}
    </span>
  )
}
