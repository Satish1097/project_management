import { ChevronDown, ChevronsUp, ChevronUp, Minus } from 'lucide-react'
import type { TaskPriority } from '@/types/tasks'
import { cn } from '@/utils/cn'

const config: Record<
  TaskPriority,
  { icon: typeof ChevronsUp; className: string }
> = {
  high: { icon: ChevronsUp, className: 'text-[#ba1a1a]' },
  medium: { icon: ChevronUp, className: 'text-[#004191]' },
  low: { icon: ChevronDown, className: 'text-[#b45309]' },
  none: { icon: Minus, className: 'text-[#727784]' },
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const { icon: Icon, className } = config[priority]
  return (
    <div className="flex justify-center">
      <Icon className={cn('size-3', className)} strokeWidth={2.5} />
    </div>
  )
}
