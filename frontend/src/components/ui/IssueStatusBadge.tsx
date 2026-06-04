import type { TaskStatus } from '@/types/tasks'
import { cn } from '@/utils/cn'

const config: Record<
  TaskStatus,
  { label: string; bg: string; dot: string; text: string }
> = {
  backlog: {
    label: 'BACKLOG',
    bg: 'bg-devflow-nav-active',
    dot: 'bg-[var(--df-status-dot-neutral)]',
    text: 'text-devflow-nav-active-text',
  },
  todo: {
    label: 'TODO',
    bg: 'bg-[var(--df-brand-tint)]',
    dot: 'bg-devflow-brand-deep',
    text: 'text-devflow-brand',
  },
  in_progress: {
    label: 'IN PROGRESS',
    bg: 'bg-[var(--df-warning-tint)]',
    dot: 'bg-devflow-warning',
    text: 'text-devflow-warning',
  },
  review: {
    label: 'REVIEW',
    bg: 'bg-[var(--df-brand-tint)]',
    dot: 'bg-devflow-primary',
    text: 'text-devflow-primary',
  },
  done: {
    label: 'DONE',
    bg: 'bg-devflow-muted',
    dot: 'bg-devflow-success',
    text: 'text-devflow-success',
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
