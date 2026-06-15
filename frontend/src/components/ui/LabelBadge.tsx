import { cn } from '@/utils/cn'

type LabelBadgeProps = {
  label: string
  variant?: 'default' | 'critical'
}

export function LabelBadge({ label, variant = 'default' }: LabelBadgeProps) {
  return (
    <span
      className={cn(
        'rounded px-2 py-0.5 text-caption-label',
        variant === 'critical'
          ? 'bg-devflow-danger-bg text-devflow-danger-text'
          : 'bg-devflow-pill text-devflow-text-secondary',
      )}
    >
      {label}
    </span>
  )
}
