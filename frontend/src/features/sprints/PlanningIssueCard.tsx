import { GripVertical } from 'lucide-react'
import { useIssueDetail } from '@/contexts/IssueDetailContext'
import { useIssueCardClick } from '@/hooks/useIssueCardClick'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
  InlineSprintPicker,
} from '@/components/issues/inline'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type PlanningIssueCardProps = {
  issue: ProjectIssue
  draggable?: boolean
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
  compact?: boolean
  inlineEdit?: boolean
}

export function PlanningIssueCard({
  issue,
  draggable = true,
  onDragStart,
  onDragEnd,
  compact,
  inlineEdit = false,
}: PlanningIssueCardProps) {
  const { openIssueDetail } = useIssueDetail()
  const { onClick, onKeyDown, onDragStart: onCardDragStart, onDragEnd: onCardDragEnd } =
    useIssueCardClick(() => openIssueDetail({ issueId: issue.id }))
  const { assignUser, setPriority, setLabels, assignSprint, pendingIds } =
    useOptimisticIssueActions(issue.projectId)
  const isPending = pendingIds.has(issue.id)

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
        'flex cursor-grab items-start gap-2 rounded-lg border border-devflow-border bg-devflow-card p-2.5 shadow-devflow-sm transition-shadow hover:shadow-devflow-md active:cursor-grabbing active:shadow-devflow-md',
        compact && 'p-2',
        isPending && 'opacity-70',
      )}
    >
      <GripVertical className="mt-0.5 size-4 shrink-0 text-devflow-text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-caption text-devflow-text-muted">
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
          {issue.storyPoints != null && (
            <span className="rounded bg-devflow-pill px-1.5 py-0.5 text-caption text-devflow-text-secondary">
              {issue.storyPoints} pts
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-body text-devflow-text">
          {issue.title}
        </p>
        <div
          className="mt-1.5 flex flex-wrap items-center gap-2"
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
              <InlineSprintPicker
                projectId={issue.projectId}
                value={issue.sprintId}
                compact
                disabled={isPending}
                onChange={(sprintId) => void assignSprint(issue.id, sprintId)}
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
              <Avatar name={issue.assignee.name} color={issue.assignee.color} size={20} />
              <span className="truncate text-caption text-devflow-text-muted">
                {issue.assignee.name}
              </span>
              <span className="rounded px-1.5 py-0.5 text-caption text-devflow-text-secondary bg-devflow-muted">
                {issue.label}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
