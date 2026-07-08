import { useState } from 'react'
import {
  BookOpen,
  Bug,
  CheckSquare,
  ExternalLink,
  GitBranch,
  GripVertical,
  Layers,
  Lightbulb,
  Pencil,
  Sparkles,
} from 'lucide-react'
import { useIssueDetail } from '@/contexts/IssueDetailContext'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
  InlineSprintPicker,
  InlineSummaryEditor,
} from '@/components/issues/inline'
import { ISSUE_TYPE_OPTIONS } from '@/constants/issueOptions'
import { useOptimisticIssueActions } from '@/hooks/useOptimisticIssueActions'
import type { IssueType, ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

const TYPE_ICONS: Record<IssueType, typeof CheckSquare> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  epic: Layers,
  improvement: Lightbulb,
  subtask: GitBranch,
  spike: Sparkles,
}

function IssueTypeIcon({ type }: { type: IssueType }) {
  const Icon = TYPE_ICONS[type]
  const label =
    ISSUE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type

  return (
    <span title={label} className="inline-flex shrink-0 text-devflow-text-muted">
      <Icon className="size-3.5" strokeWidth={2} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  )
}

type BacklogIssueCardProps = {
  issue: ProjectIssue
  projectId: string
  selected: boolean
  onSelectChange: (selected: boolean) => void
  onDragStart?: (issueId: string) => void
  onDragEnd?: () => void
  draggable?: boolean
  isEntering?: boolean
  isExiting?: boolean
  isHighlighted?: boolean
}

export function BacklogIssueCard({
  issue,
  projectId,
  selected,
  onSelectChange,
  onDragStart,
  onDragEnd,
  draggable = true,
  isEntering = false,
  isExiting = false,
  isHighlighted = false,
}: BacklogIssueCardProps) {
  const { openIssueDetail } = useIssueDetail()
  const { pendingIds, assignUser, setTitle, setPriority, setLabels, assignSprint } =
    useOptimisticIssueActions(projectId)
  const isPending = pendingIds.has(issue.id)
  const issueType = issue.issueType ?? 'task'
  const [editRequestVersion, setEditRequestVersion] = useState(0)

  return (
    <div
      className={cn(
        'group flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-devflow-border/60 px-3 py-2',
        'text-[13px] transition-colors hover:bg-devflow-muted/25',
        isEntering && 'backlog-row-enter',
        isExiting && 'backlog-row-exit',
        isHighlighted && 'backlog-row-created',
        isPending && 'opacity-60',
        selected && 'bg-[var(--df-nav-tint)]/12 hover:bg-[var(--df-nav-tint)]/16 backlog-row-selected',
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelectChange(!selected)}
        className="size-3.5 shrink-0 accent-devflow-primary"
        aria-label={`Select ${issue.key}`}
        onClick={(event) => event.stopPropagation()}
      />

      <button
        type="button"
        draggable={draggable}
        onDragStart={() => onDragStart?.(issue.id)}
        onDragEnd={onDragEnd}
        className="shrink-0 cursor-grab rounded p-0.5 text-devflow-text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label={`Drag ${issue.key}`}
        onClick={(event) => event.stopPropagation()}
      >
        <GripVertical className="size-3.5" />
      </button>

      <IssueTypeIcon type={issueType} />

      <button
        type="button"
        onClick={() => openIssueDetail({ issueId: issue.id })}
        className="shrink-0 font-mono text-[11px] text-devflow-text-muted hover:text-devflow-primary"
        title={issue.key}
      >
        {issue.key}
      </button>

      <div
        className="min-w-0 flex flex-1 basis-[12rem] items-center gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <InlineSummaryEditor
          value={issue.title}
          disabled={isPending}
          autoFocus={false}
          activateOnClick={false}
          enableDoubleClickEdit
          editRequestVersion={editRequestVersion}
          onSave={(title) => setTitle(issue.id, title)}
          onOpenDetail={() => openIssueDetail({ issueId: issue.id })}
          className="w-auto max-w-full"
        />
        <button
          type="button"
          onClick={() => setEditRequestVersion((prev) => prev + 1)}
          className={cn(
            'h-6 w-6 shrink-0 rounded p-1 text-devflow-text-muted',
            'pointer-events-none opacity-0 transition-opacity duration-150 ease-out',
            'hover:bg-devflow-muted/50 hover:text-devflow-text',
            'group-hover:pointer-events-auto group-hover:opacity-100',
            'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
            'focus-visible:pointer-events-auto focus-visible:opacity-100',
          )}
          aria-label={`Edit ${issue.key}`}
          title="Edit issue title"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <div
        className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2"
        onClick={(event) => event.stopPropagation()}
      >
        <InlineAssigneePicker
          projectId={projectId}
          value={issue.assigneeId ?? null}
          assignee={issue.assignee}
          disabled={isPending}
          compact
          onChange={(userId, member) => {
            void assignUser(issue.id, userId, member)
          }}
        />

        <InlinePriorityPicker
          value={issue.priorityLevel ?? 'medium'}
          disabled={isPending}
          compact
          onChange={(priority) => {
            void setPriority(issue.id, priority)
          }}
        />

        <InlineLabelPicker
          projectId={projectId}
          value={issue.labelIds ?? []}
          labelNames={issue.labels}
          disabled={isPending}
          onChange={(labelIds, labelNames) => {
            void setLabels(issue.id, labelIds, labelNames)
          }}
        />

        <InlineSprintPicker
          projectId={projectId}
          value={issue.sprintId}
          disabled={isPending}
          compact
          onChange={(sprintId) => {
            void assignSprint(issue.id, sprintId)
          }}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => openIssueDetail({ issueId: issue.id })}
          className="rounded p-1 text-devflow-text-muted opacity-0 transition hover:bg-devflow-muted/50 hover:text-devflow-text group-hover:opacity-100 focus-visible:opacity-100"
          aria-label={`Open ${issue.key}`}
          title="Open issue"
        >
          <ExternalLink className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
