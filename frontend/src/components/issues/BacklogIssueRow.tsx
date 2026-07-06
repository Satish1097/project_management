import { ExternalLink, GripVertical } from 'lucide-react'
import { useIssueDetail } from '@/contexts/IssueDetailContext'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
  InlineSprintPicker,
  InlineSummaryEditor,
} from '@/components/issues/inline'
import {
  BACKLOG_ROW_GRID,
  BACKLOG_ROW_PADDING,
  BACKLOG_STICKY_HEADER,
  INLINE_CELL_TRIGGER,
} from '@/components/issues/backlogTableLayout'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type BacklogIssueRowProps = {
  issue: ProjectIssue
  projectId: string
  selected: boolean
  onSelectChange: (selected: boolean) => void
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
  draggable?: boolean
  isLast?: boolean
  isEntering?: boolean
  isExiting?: boolean
}

export function BacklogIssueRow({
  issue,
  projectId,
  selected,
  onSelectChange,
  onDragStart,
  onDragEnd,
  draggable = true,
  isLast = false,
  isEntering = false,
  isExiting = false,
}: BacklogIssueRowProps) {
  const { openIssueDetail } = useIssueDetail()
  const { pendingIds, assignUser, setTitle, setPriority, setLabels, assignSprint } =
    useOptimisticIssueActions(projectId)
  const isPending = pendingIds.has(issue.id)

  return (
    <div
      className={cn(
        BACKLOG_ROW_GRID,
        BACKLOG_ROW_PADDING,
        'group text-[13px] transition-colors',
        isEntering && 'backlog-row-enter',
        isExiting && 'backlog-row-exit',
        !isLast && 'border-b border-devflow-border/60',
        'hover:bg-devflow-muted/25',
        isPending && 'opacity-60',
        selected && 'bg-[var(--df-nav-tint)]/12 hover:bg-[var(--df-nav-tint)]/16 backlog-row-selected',
      )}
    >
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelectChange(!selected)}
          className="size-3.5 accent-devflow-primary"
          aria-label={`Select ${issue.key}`}
          onClick={(event) => event.stopPropagation()}
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          draggable={draggable}
          onDragStart={() => onDragStart?.(issue.id)}
          onDragEnd={onDragEnd}
          className="cursor-grab rounded p-0.5 text-devflow-text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          aria-label={`Drag ${issue.key}`}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => openIssueDetail({ issueId: issue.id })}
        className="truncate text-left font-mono text-[11px] text-devflow-text-muted hover:text-devflow-primary"
        title={issue.key}
      >
        {issue.key}
      </button>

      <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
        <InlineSummaryEditor
          value={issue.title}
          disabled={isPending}
          onSave={(title) => setTitle(issue.id, title)}
          onOpenDetail={() => openIssueDetail({ issueId: issue.id })}
        />
      </div>

      <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
        <InlineAssigneePicker
          projectId={projectId}
          value={issue.assigneeId ?? null}
          assignee={issue.assignee}
          disabled={isPending}
          cell
          onChange={(userId, member) => {
            void assignUser(issue.id, userId, member)
          }}
        />
      </div>

      <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
        <InlineSprintPicker
          projectId={projectId}
          value={issue.sprintId}
          disabled={isPending}
          cell
          onChange={(sprintId) => {
            void assignSprint(issue.id, sprintId)
          }}
        />
      </div>

      <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
        <InlinePriorityPicker
          value={issue.priorityLevel ?? 'medium'}
          disabled={isPending}
          cell
          onChange={(priority) => {
            void setPriority(issue.id, priority)
          }}
        />
      </div>

      <div className="min-w-0" onClick={(event) => event.stopPropagation()}>
        <InlineLabelPicker
          projectId={projectId}
          value={issue.labelIds ?? []}
          labelNames={issue.labels}
          disabled={isPending}
          cell
          onChange={(labelIds, labelNames) => {
            void setLabels(issue.id, labelIds, labelNames)
          }}
        />
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => openIssueDetail({ issueId: issue.id })}
          className={cn(
            INLINE_CELL_TRIGGER,
            'w-6 justify-center p-0 opacity-0 group-hover:opacity-100',
          )}
          aria-label={`Open ${issue.key}`}
          title="Open issue"
        >
          <ExternalLink className="size-3 text-devflow-text-muted" />
        </button>
      </div>
    </div>
  )
}

type BacklogIssueRowHeaderProps = {
  allSelected: boolean
  onToggleSelectAll: () => void
  hasIssues: boolean
}

export function BacklogIssueRowHeader({
  allSelected,
  onToggleSelectAll,
  hasIssues,
}: BacklogIssueRowHeaderProps) {
  return (
    <div
      className={cn(
        BACKLOG_ROW_GRID,
        BACKLOG_ROW_PADDING,
        BACKLOG_STICKY_HEADER,
      )}
    >
      <div className="flex justify-center">
        {hasIssues ? (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="size-3.5 accent-devflow-primary"
            aria-label="Select all backlog issues"
          />
        ) : (
          <span aria-hidden className="size-3.5" />
        )}
      </div>
      <span aria-hidden />
      <span>Key</span>
      <span>Summary</span>
      <span>Assignee</span>
      <span>Sprint</span>
      <span>Priority</span>
      <span>Labels</span>
      <span className="sr-only">Actions</span>
    </div>
  )
}
