import { useCallback, useRef, useState, type KeyboardEvent } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useIssues } from '@/contexts/IssuesContext'
import { ApiError } from '@/api/types'
import type { ProjectIssue } from '@/types/issues'
import { cn } from '@/utils/cn'

type PlanningQuickCreateProps = {
  projectId: string
  onCreated?: (issue: ProjectIssue) => void
  className?: string
}

export function PlanningQuickCreate({
  projectId,
  onCreated,
  className,
}: PlanningQuickCreateProps) {
  const { createIssueViaApi } = useIssues()
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const focusTitle = useCallback(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const submit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const issue = await createIssueViaApi(
        projectId,
        { title: trimmed, type: 'task', priority: 'medium' },
        { light: true },
      )
      setTitle('')
      onCreated?.(issue)
      focusTitle()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to create issue.'
      setError(message)
      focusTitle()
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submit()
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-transparent px-1 py-1.5',
        'transition-colors hover:border-devflow-border/60 hover:bg-devflow-muted/30',
        className,
      )}
    >
      <Plus className="size-3.5 shrink-0 text-devflow-primary" aria-hidden />
      <div className="relative min-w-0 flex-1">
        <input
          ref={inputRef}
          type="text"
          value={title}
          readOnly={submitting}
          aria-label="Create issue"
          aria-invalid={error ? true : undefined}
          placeholder="Create issue"
          className={cn(
            'w-full min-w-0 bg-transparent text-[13px] text-devflow-text outline-none',
            'placeholder:text-devflow-primary placeholder:font-medium',
            submitting && 'pr-6',
          )}
          onChange={(event) => {
            setTitle(event.target.value)
            if (error) setError(null)
          }}
          onKeyDown={handleKeyDown}
        />
        {submitting ? (
          <Loader2
            className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-devflow-text-muted"
            aria-hidden
          />
        ) : null}
        {error ? (
          <p role="alert" className="mt-0.5 text-[11px] text-devflow-error">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
