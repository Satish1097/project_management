import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useIssues } from '@/contexts/IssuesContext'
import {
  InlineAssigneePicker,
  InlineLabelPicker,
  InlinePriorityPicker,
  InlineSprintPicker,
} from '@/components/issues/inline'
import {
  BACKLOG_ROW_GRID,
  BACKLOG_ROW_PADDING,
} from '@/components/issues/backlogTableLayout'
import { ApiError } from '@/api/types'
import type { IssuePriorityLevel, ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type BacklogQuickCreateProps = {
  projectId: string
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onCreated?: (issue: ProjectIssue) => void
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  variant?: 'row' | 'stacked'
  className?: string
}

const DEFAULT_PRIORITY: IssuePriorityLevel = 'medium'

export function BacklogCreateButton({
  onClick,
  label = 'Create issue',
  className,
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium',
        'text-devflow-primary transition-colors hover:bg-devflow-primary/8',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/25',
        className,
      )}
    >
      <Plus className="size-3.5 shrink-0" aria-hidden />
      {label}
    </button>
  )
}

export function BacklogQuickCreate({
  projectId,
  expanded,
  onExpandedChange,
  onCreated,
  scrollContainerRef,
  variant = 'row',
  className,
}: BacklogQuickCreateProps) {
  const { createIssueViaApi } = useIssues()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<IssuePriorityLevel>(DEFAULT_PRIORITY)
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [labelIds, setLabelIds] = useState<string[]>([])
  const [sprintId, setSprintId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)

  const focusTitle = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    })
  }, [])

  useEffect(() => {
    if (expanded) focusTitle()
  }, [expanded, focusTitle])

  const resetOptionalFields = () => {
    setPriority(DEFAULT_PRIORITY)
    setAssigneeId(null)
    setLabelIds([])
    setSprintId(null)
  }

  const cancel = () => {
    setTitle('')
    setError(null)
    resetOptionalFields()
    onExpandedChange(false)
  }

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return

    const scrollTop = scrollContainerRef?.current?.scrollTop ?? 0

    setSubmitting(true)
    setError(null)

    try {
      const issue = await createIssueViaApi(
        projectId,
        {
          title: trimmed,
          type: 'task',
          priority,
          sprint: sprintId,
          assignee: assigneeId,
          labels: labelIds.length > 0 ? labelIds : undefined,
        },
        { light: true },
      )
      setTitle('')
      setError(null)
      resetOptionalFields()
      onCreated?.(issue)
      focusTitle()
      if (scrollContainerRef?.current) {
        scrollContainerRef.current.scrollTop = scrollTop
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create issue.'
      setError(message)
      focusTitle()
    } finally {
      setSubmitting(false)
    }
  }

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  if (!expanded) return null

  const summaryInput = (
    <div className="relative min-w-0">
      <input
        ref={inputRef}
        type="text"
        value={title}
        readOnly={submitting}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'quick-create-error' : undefined}
        onChange={(event) => {
          setTitle(event.target.value)
          if (error) setError(null)
        }}
        placeholder="What needs to be done?"
        className={cn(
          variant === 'stacked' ? 'h-8 px-2' : 'h-6 px-1.5',
          'w-full min-w-0 rounded border border-devflow-border bg-devflow-surface',
          'text-[13px] text-devflow-text outline-none placeholder:text-devflow-text-muted',
          'focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/15',
          submitting && 'pr-7',
        )}
        onKeyDown={handleTitleKeyDown}
      />
      {submitting ? (
        <Loader2
          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-devflow-text-muted"
          aria-hidden
        />
      ) : null}
      {error ? (
        <p
          id="quick-create-error"
          role="alert"
          className={cn(
            'text-devflow-error',
            variant === 'stacked' ? 'mt-1 text-[11px]' : 'sr-only',
          )}
        >
          {error}
        </p>
      ) : null}
    </div>
  )

  const optionalFields = (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        variant === 'row' && 'contents',
      )}
      onKeyDown={(e) => e.key === 'Escape' && e.stopPropagation()}
    >
      <div className={variant === 'row' ? 'min-w-0' : undefined}>
        <InlineAssigneePicker
          projectId={projectId}
          value={assigneeId}
          compact
          cell={variant === 'row'}
          disabled={submitting}
          onChange={(userId) => setAssigneeId(userId)}
        />
      </div>
      <div className={variant === 'row' ? 'min-w-0' : undefined}>
        <InlineSprintPicker
          projectId={projectId}
          value={sprintId}
          compact
          cell={variant === 'row'}
          disabled={submitting}
          onChange={setSprintId}
        />
      </div>
      <div className={variant === 'row' ? 'min-w-0' : undefined}>
        <InlinePriorityPicker
          value={priority}
          compact
          cell={variant === 'row'}
          disabled={submitting}
          onChange={setPriority}
        />
      </div>
      <div className={variant === 'row' ? 'min-w-0' : undefined}>
        <InlineLabelPicker
          projectId={projectId}
          value={labelIds}
          disabled={submitting}
          cell={variant === 'row'}
          onChange={(ids) => setLabelIds(ids)}
        />
      </div>
    </div>
  )

  if (variant === 'stacked') {
    return (
      <div
        ref={rowRef}
        role="form"
        aria-label="Quick create issue"
        className={cn('space-y-2', className)}
      >
        {summaryInput}
        {optionalFields}
        <p className="text-[10px] text-devflow-text-muted">
          Press Enter to create · Esc to cancel
        </p>
      </div>
    )
  }

  return (
    <div
      ref={rowRef}
      role="form"
      aria-label="Quick create issue"
      className={cn(
        BACKLOG_ROW_GRID,
        BACKLOG_ROW_PADDING,
        'backlog-quick-create-row border-b border-devflow-primary/15',
        className,
      )}
    >
      <span aria-hidden className="size-3.5" />
      <span aria-hidden className="size-3" />
      <span className="font-mono text-[10px] text-devflow-text-muted">NEW</span>
      {summaryInput}
      {optionalFields}
      <span aria-hidden />
    </div>
  )
}
