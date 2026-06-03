import type { TaskStatus } from '@/types/tasks'
import { cn } from '@/utils/cn'

const config: Record<
  TaskStatus,
  { label: string; bg: string; dot: string; text: string }
> = {
  in_progress: {
    label: 'IN PROGRESS',
    bg: 'bg-[rgba(180,83,9,0.1)]',
    dot: 'bg-[#b45309]',
    text: 'text-[#b45309]',
  },
  todo: {
    label: 'TODO',
    bg: 'bg-[rgba(0,65,145,0.1)]',
    dot: 'bg-[#004191]',
    text: 'text-[#004191]',
  },
  backlog: {
    label: 'BACKLOG',
    bg: 'bg-[#d4e3ff]',
    dot: 'bg-[#505f76]',
    text: 'text-[#56657c]',
  },
}

export function IssueStatusBadge({ status }: { status: TaskStatus }) {
  const s = config[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption-label',
        s.bg,
        s.text,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}
