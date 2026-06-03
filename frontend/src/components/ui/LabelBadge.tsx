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
          ? 'bg-[#ffdad6] text-[#93000a]'
          : 'bg-[#e6e8ea] text-[#424753]',
      )}
    >
      {label}
    </span>
  )
}
