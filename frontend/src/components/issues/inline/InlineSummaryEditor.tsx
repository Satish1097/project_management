import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { cn } from '@/utils/cn'

type InlineSummaryEditorProps = {
  value: string
  onSave: (next: string) => void | Promise<void>
  disabled?: boolean
  className?: string
  onOpenDetail?: () => void
}

export function InlineSummaryEditor({
  value,
  onSave,
  disabled = false,
  className,
  onOpenDetail,
}: InlineSummaryEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  const startEditing = useCallback(() => {
    if (disabled) return
    setDraft(value)
    setEditing(true)
    requestAnimationFrame(() => inputRef.current?.select())
  }, [disabled, value])

  const commit = useCallback(async () => {
    const trimmed = draft.trim()
    setEditing(false)
    if (!trimmed || trimmed === value) return
    await onSave(trimmed)
  }, [draft, onSave, value])

  const cancel = useCallback(() => {
    setDraft(value)
    setEditing(false)
  }, [value])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void commit()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        disabled={disabled}
        aria-label="Edit issue summary"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-6 w-full min-w-0 rounded border border-devflow-primary/40 bg-devflow-surface px-1.5',
          'text-[13px] text-devflow-text outline-none ring-2 ring-devflow-primary/15',
          className,
        )}
      />
    )
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={startEditing}
      onDoubleClick={(event) => {
        event.preventDefault()
        onOpenDetail?.()
      }}
      title={value}
      className={cn(
        'h-6 w-full min-w-0 truncate rounded border border-transparent px-1 text-left',
        'text-[13px] text-devflow-text transition-colors',
        'hover:border-devflow-border/60 hover:bg-devflow-muted/40',
        'focus-visible:border-devflow-primary/50 focus-visible:bg-devflow-muted/40 focus-visible:outline-none',
        disabled && 'cursor-default opacity-60',
        className,
      )}
    >
      {value}
    </button>
  )
}
