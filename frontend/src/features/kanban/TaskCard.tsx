import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import {
  DEFAULT_BOARD_CONTEXT,
  sprintIssueDetailPath,
} from '@/constants/routes'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/PriorityBadge'
import type { KanbanIssue } from '@/types/kanban'
import { cn } from '@/utils/cn'

type TaskCardProps = {
  issue: KanbanIssue
  columnId: string
  projectId?: string
  sprintId?: string
}

export function TaskCard({
  issue,
  columnId,
  projectId = DEFAULT_BOARD_CONTEXT.projectId,
  sprintId = DEFAULT_BOARD_CONTEXT.sprintId,
}: TaskCardProps) {
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

      <div className="flex items-center justify-between">
        {issue.label && (
          <span className="rounded bg-devflow-pill px-2 py-0.5 text-caption-label text-devflow-text-secondary">
            {issue.label}
          </span>
        )}
        {issue.assignee && (
          <Avatar name={issue.assignee.name} color={issue.assignee.color} size={24} />
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

  if (issue.key === 'DF-101') {
    return (
      <Link
        to={sprintIssueDetailPath(projectId, sprintId)}
        className={cn('block', className)}
      >
        {content}
      </Link>
    )
  }

  return <article className={className}>{content}</article>
}
