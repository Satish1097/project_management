import { ExternalLink, GripVertical } from 'lucide-react'
import { useIssueDetail } from '@/contexts/IssueDetailContext'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
  InlineSprintPicker,
  InlineSummaryEditor,
} from '@/components/issues/inline'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type BacklogMobileCardProps = {
  issue: ProjectIssue
  projectId: string
  selected: boolean
  onSelectChange: (selected: boolean) => void
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
  isEntering?: boolean
  isExiting?: boolean
}

export function BacklogMobileCard({
  issue,
  projectId,
  selected,
  onSelectChange,
  onDragStart,
  onDragEnd,
  isEntering = false,
  isExiting = false,
}: BacklogMobileCardProps) {
  const { openIssueDetail } = useIssueDetail()
  const { pendingIds, assignUser, setTitle, setPriority, setLabels, assignSprint } =
    useOptimisticIssueActions(projectId)
  const isPending = pendingIds.has(issue.id)

  return (
    <article
      className={cn(
        'rounded-md border border-devflow-border/80 bg-devflow-card p-2.5 transition-colors',
        isEntering && 'backlog-row-enter',
        isExiting && 'backlog-row-exit',
        selected && 'border-devflow-primary/30 bg-[var(--df-nav-tint)]/10 backlog-row-selected',
        isPending && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectChange(!selected)}
          className="mt-0.5 size-3.5 accent-devflow-primary"
          aria-label={`Select ${issue.key}`}
        />
        <button
          type="button"
          draggable
          onDragStart={() => onDragStart?.(issue.id)}
          onDragEnd={onDragEnd}
          className="mt-0.5 cursor-grab rounded p-0.5 text-devflow-text-muted active:cursor-grabbing"
          aria-label={`Drag ${issue.key}`}
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => openIssueDetail({ issueId: issue.id })}
              className="font-mono text-[11px] text-devflow-text-muted hover:text-devflow-primary"
            >
              {issue.key}
            </button>
            <button
              type="button"
              onClick={() => openIssueDetail({ issueId: issue.id })}
              className="rounded p-1 text-devflow-text-muted hover:bg-devflow-muted/50"
              aria-label={`Open ${issue.key}`}
            >
              <ExternalLink className="size-3.5" />
            </button>
          </div>
          <InlineSummaryEditor
            value={issue.title}
            disabled={isPending}
            onSave={(title) => setTitle(issue.id, title)}
            onOpenDetail={() => openIssueDetail({ issueId: issue.id })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <InlineAssigneePicker
              projectId={projectId}
              value={issue.assigneeId ?? null}
              assignee={issue.assignee}
              disabled={isPending}
              compact
              onChange={(userId, member) => void assignUser(issue.id, userId, member)}
            />
            <InlineSprintPicker
              projectId={projectId}
              value={issue.sprintId}
              disabled={isPending}
              compact
              onChange={(sprintId) => void assignSprint(issue.id, sprintId)}
            />
            <InlinePriorityPicker
              value={issue.priorityLevel ?? 'medium'}
              disabled={isPending}
              compact
              onChange={(priority) => void setPriority(issue.id, priority)}
            />
            <InlineLabelPicker
              projectId={projectId}
              value={issue.labelIds ?? []}
              labelNames={issue.labels}
              disabled={isPending}
              onChange={(labelIds, labelNames) =>
                void setLabels(issue.id, labelIds, labelNames)
              }
            />
          </div>
        </div>
      </div>
    </article>
  )
}
