import { Check } from 'lucide-react'
import { useIssueDetail } from '@/contexts/IssueDetailContext'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import type { KanbanIssue } from '@/types/kanban'
import { cn } from '@/utils/cn'

type TaskCardProps = {
  issue: KanbanIssue
  columnId: string
}

export function TaskCard({ issue, columnId }: TaskCardProps) {
  const { openIssueDetail } = useIssueDetail()
  const isDone = issue.done || columnId === 'done'
  const inProgress = columnId === 'in_progress'

  const className = cn(
    'flex flex-col gap-1.5 rounded-lg border p-3',
    isDone
      ? 'border-devflow-border bg-devflow-muted opacity-80'
      : 'border-devflow-border bg-devflow-card shadow-devflow-sm',
    inProgress && 'border-l-4 border-l-devflow-primary pl-5',
  )

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'font-mono text-caption',
            isDone ? 'text-devflow-text-muted' : 'text-devflow-text-secondary',
          )}
        >
          {issue.key}
        </span>
        {issue.priority && <PriorityBadge priority={issue.priority} />}
      </div>

      <p
        className={cn(
          'text-body font-medium',
          isDone ? 'text-devflow-text-secondary line-through' : 'text-devflow-text',
        )}
      >
        {issue.title}
      </p>

      <div className="flex min-h-6 items-center justify-between gap-2">
        {issue.label ? (
          <span className="rounded bg-devflow-pill px-2 py-0.5 text-caption font-medium uppercase tracking-wide text-devflow-text-secondary">
            {issue.label}
          </span>
        ) : (
          <span />
        )}
        {issue.assignee && (
          <Avatar
            name={issue.assignee.name}
            color={issue.assignee.color}
            size={24}
            className="shrink-0"
          />
        )}
        {isDone && (
          <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-devflow-success text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
      </div>

      {issue.progress !== undefined && inProgress && (
        <div className="flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-devflow-table-header">
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

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => openIssueDetail({ issueId: issue.id })}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openIssueDetail({ issueId: issue.id })
        }
      }}
      className={cn(className, 'cursor-pointer transition-shadow hover:shadow-devflow-md')}
    >
      {content}
    </article>
  )
}
