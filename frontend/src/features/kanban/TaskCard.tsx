import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import type { KanbanIssue } from '@/types/kanban'
import { cn } from '@/utils/cn'

type TaskCardProps = {
  issue: KanbanIssue
  columnId: string
}

export function TaskCard({ issue, columnId }: TaskCardProps) {
  const isDone = issue.done || columnId === 'done'
  const inProgress = columnId === 'in_progress'

  const className = cn(
    'flex flex-col gap-1.5 rounded-lg border p-3',
    isDone
      ? 'border-devflow-border bg-[#f2f4f6] opacity-80'
      : 'border-devflow-border bg-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]',
    inProgress && 'border-l-4 border-l-devflow-primary pl-5',
  )

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'font-mono text-caption font-medium tracking-[0.24px] text-devflow-text-muted',
            isDone && 'line-through',
          )}
        >
          {issue.key}
        </span>
        {isDone ? (
          <Check className="size-3 text-[#10b981]" strokeWidth={3} />
        ) : (
          issue.priority && <PriorityBadge priority={issue.priority} />
        )}
      </div>

      <h3
        className={cn(
          'text-card-title text-devflow-text',
          isDone && 'text-devflow-text-secondary line-through',
        )}
      >
        {issue.title}
      </h3>

      <div className="flex items-center justify-between pt-2">
        <span
          className={cn(
            'rounded-lg px-2 py-0.5 text-caption font-medium',
            isDone
              ? 'bg-[#e6e8ea] text-devflow-text-secondary'
              : 'bg-[rgba(208,225,251,0.5)] text-[#54647a]',
          )}
        >
          {issue.label}
        </span>
        <Avatar name={issue.assignee.name} color={issue.assignee.color} />
      </div>

      {issue.progress !== undefined && (
        <div className="flex items-center gap-4 pt-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eceef0]">
            <div
              className="h-full rounded-full bg-devflow-primary"
              style={{ width: `${issue.progress}%` }}
            />
          </div>
          <span className="text-caption text-devflow-text-secondary">
            {issue.progress}%
          </span>
        </div>
      )}
    </>
  )

  if (issue.key === 'DF-101') {
    return (
      <Link to={ROUTES.issueDetail} className={cn('block', className)}>
        {content}
      </Link>
    )
  }

  return <article className={className}>{content}</article>
}
