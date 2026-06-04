import { GripVertical } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type PlanningIssueCardProps = {
  issue: ProjectIssue
  draggable?: boolean
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
  compact?: boolean
}

export function PlanningIssueCard({
  issue,
  draggable = true,
  onDragStart,
  onDragEnd,
  compact,
}: PlanningIssueCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart?.(issue.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'flex cursor-grab items-start gap-2 rounded-lg border border-devflow-border bg-devflow-card p-2.5 shadow-devflow-sm transition-shadow active:cursor-grabbing active:shadow-devflow-md',
        compact && 'p-2',
      )}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-devflow-text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-caption text-devflow-text-muted">
            {issue.key}
          </span>
          {issue.priority && (
            <PriorityIndicator priority={issue.priority as 'high' | 'medium' | 'low'} />
          )}
          {issue.storyPoints != null && (
            <span className="rounded bg-devflow-pill px-1.5 py-0.5 text-caption text-devflow-text-secondary">
              {issue.storyPoints} pts
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-body text-devflow-text">
          {issue.title}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <Avatar name={issue.assignee.name} color={issue.assignee.color} size={20} />
          <span className="truncate text-caption text-devflow-text-muted">
            {issue.assignee.name}
          </span>
          <span className="rounded px-1.5 py-0.5 text-caption text-devflow-text-secondary bg-devflow-muted">
            {issue.label}
          </span>
        </div>
      </div>
    </div>
  )
}
