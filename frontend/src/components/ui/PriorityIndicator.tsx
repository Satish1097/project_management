import { ChevronDown, ChevronsUp, ChevronUp, Minus } from 'lucide-react'
import type { TaskPriority } from '@/types/tasks'
import { cn } from '@/utils/cn'

const config: Record<
  TaskPriority,
  { icon: typeof ChevronsUp; className: string }
> = {
  high: { icon: ChevronsUp, className: 'text-devflow-error' },
  medium: { icon: ChevronUp, className: 'text-devflow-brand' },
  low: { icon: ChevronDown, className: 'text-devflow-warning' },
  none: { icon: Minus, className: 'text-devflow-text-muted' },
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const { icon: Icon, className } = config[priority]
  return (
    <div className="flex justify-center">
      <Icon className={cn('size-3', className)} strokeWidth={2.5} />
    </div>
  )
}
