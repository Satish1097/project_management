import { GripVertical } from 'lucide-react'
import { useIssueDetail } from '@/contexts/IssueDetailContext'
import { useIssueCardClick } from '@/hooks/useIssueCardClick'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
} from '@/components/issues/inline'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import { getIssueDetailExtras } from '@/services/issueDetailStore'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type PlanningIssueCardProps = {
  issue: ProjectIssue
  draggable?: boolean
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
  compact?: boolean
  inlineEdit?: boolean
  selectable?: boolean
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
}

export function PlanningIssueCard({
  issue,
  draggable = true,
  onDragStart,
  onDragEnd,
  compact = true,
  inlineEdit = false,
  selectable = false,
  selected = false,
  onSelectChange,
}: PlanningIssueCardProps) {
  const { openIssueDetail } = useIssueDetail()
  const { onClick, onKeyDown, onDragStart: onCardDragStart, onDragEnd: onCardDragEnd } =
    useIssueCardClick(() => openIssueDetail({ issueId: issue.id }))
  const { assignUser, setPriority, setLabels, pendingIds } =
    useOptimisticIssueActions(issue.projectId)
  const isPending = pendingIds.has(issue.id)
  const epic =
    issue.issueType !== 'epic'
      ? getIssueDetailExtras(issue).epic
      : undefined

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onDragStart={() => {
        onCardDragStart()
        onDragStart?.(issue.id)
      }}
      onDragEnd={() => {
        onCardDragEnd()
        onDragEnd?.()
      }}
      className={cn(
        'flex cursor-grab items-start gap-1.5 rounded-md border border-devflow-border bg-devflow-card shadow-devflow-sm transition-shadow hover:shadow-devflow-md active:cursor-grabbing',
        compact ? 'p-2' : 'p-2.5',
        isPending && 'opacity-70',
        selected && 'border-devflow-primary/50 bg-[var(--df-nav-tint)]/10',
      )}
    >
      {selectable ? (
        <input
          type="checkbox"
          checked={selected}
          aria-label={`Select ${issue.key}`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onSelectChange?.(event.target.checked)}
          className="mt-1 size-3.5 shrink-0 rounded border-devflow-border text-devflow-primary focus:ring-devflow-primary/30"
        />
      ) : null}
      <GripVertical className="mt-0.5 size-3.5 shrink-0 text-devflow-text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-[11px] text-devflow-text-muted">
            {issue.key}
          </span>
          {inlineEdit ? (
            <div onClick={(event) => event.stopPropagation()}>
              <InlinePriorityPicker
                value={issue.priorityLevel ?? 'medium'}
                compact
                disabled={isPending}
                onChange={(priority) => void setPriority(issue.id, priority)}
              />
            </div>
          ) : issue.priority ? (
            <PriorityIndicator priority={issue.priority} />
          ) : null}
          {issue.storyPoints != null ? (
            <span className="rounded bg-devflow-pill px-1 py-0 text-[10px] text-devflow-text-secondary">
              {issue.storyPoints} pts
            </span>
          ) : null}
          {epic ? (
            <span className="truncate text-[10px] text-devflow-text-muted">
              {epic}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            'line-clamp-1 text-devflow-text',
            compact ? 'text-[13px]' : 'text-body',
          )}
        >
          {issue.title}
        </p>
        <div
          className="mt-1 flex flex-wrap items-center gap-1.5"
          onClick={(event) => event.stopPropagation()}
        >
          {inlineEdit ? (
            <>
              <InlineAssigneePicker
                projectId={issue.projectId}
                value={issue.assigneeId ?? null}
                assignee={issue.assignee}
                compact
                disabled={isPending}
                onChange={(userId, member) => void assignUser(issue.id, userId, member)}
              />
              <InlineLabelPicker
                projectId={issue.projectId}
                value={issue.labelIds ?? []}
                labelNames={issue.labels}
                disabled={isPending}
                onChange={(labelIds, labelNames) =>
                  void setLabels(issue.id, labelIds, labelNames)
                }
              />
            </>
          ) : (
            <>
              <UserAvatar
                name={issue.assignee.name}
                color={issue.assignee.color}
                size={18}
                userId={issue.assigneeId ?? undefined}
                projectId={issue.projectId}
              />
              <span className="truncate text-[11px] text-devflow-text-muted">
                {issue.assignee.name}
              </span>
              {(issue.labels ?? [issue.label]).slice(0, 2).map((label) => (
                <span
                  key={label}
                  className="rounded bg-devflow-muted px-1 py-0 text-[10px] text-devflow-text-secondary"
                >
                  {label}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
