import type { IssuePriority } from '@/types/kanban'
import { cn } from '@/utils/cn'

const styles: Record<
  IssuePriority,
  { bg: string; text: string; label: string }
> = {
  high: { bg: 'bg-devflow-danger-bg', text: 'text-devflow-error', label: 'HIGH' },
  medium: { bg: 'bg-devflow-warning-bg', text: 'text-devflow-warning', label: 'MEDIUM' },
  low: { bg: 'bg-devflow-pill', text: 'text-devflow-text-secondary', label: 'LOW' },
}

export function PriorityBadge({ priority }: { priority: IssuePriority }) {
  const s = styles[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption-label tracking-[-0.25px]',
        s.bg,
        s.text,
      )}
    >
      {priority === 'high' && <span className="font-bold">!</span>}
      {s.label}
    </span>
  )
}
