import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useClickOutside } from '@/hooks/useClickOutside'
import { cn } from '@/utils/cn'

export type InlineDropdownOption = {
  id: string
  label: string
  keywords?: string
  icon?: ReactNode
  disabled?: boolean
}

type InlineDropdownProps = {
  trigger: ReactNode
  options: InlineDropdownOption[]
  onSelect: (optionId: string) => void
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  align?: 'left' | 'right'
  className?: string
  panelClassName?: string
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
  footer?: ReactNode
  fullWidth?: boolean
}

export function InlineDropdown({
  trigger,
  options,
  onSelect,
  searchable = false,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches',
  align = 'left',
  className,
  panelClassName,
  disabled = false,
  onOpenChange,
  footer,
  fullWidth = false,
}: InlineDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const setOpenState = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
      if (!next) {
        setQuery('')
        setHighlightIndex(0)
      }
    },
    [onOpenChange],
  )

  useClickOutside(containerRef, () => setOpenState(false), open)

  const filtered = options.filter((option) => {
    if (!searchable || !query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      option.label.toLowerCase().includes(q) ||
      option.keywords?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (highlightIndex >= filtered.length) {
      setHighlightIndex(Math.max(0, filtered.length - 1))
    }
  }, [filtered.length, highlightIndex])

  useEffect(() => {
    if (open && searchable) {
      searchRef.current?.focus()
    }
  }, [open, searchable])

  const selectOption = (optionId: string) => {
    onSelect(optionId)
    setOpenState(false)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setOpenState(true)
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightIndex((index) => Math.min(index + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setHighlightIndex((index) => Math.max(index - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        if (filtered[highlightIndex] && !filtered[highlightIndex].disabled) {
          selectOption(filtered[highlightIndex].id)
        }
        break
      case 'Escape':
        event.preventDefault()
        setOpenState(false)
        break
      default:
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative', fullWidth ? 'flex w-full min-w-0' : 'inline-flex', className)}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={(event) => {
          event.stopPropagation()
          if (!disabled) setOpenState(!open)
        }}
        className={cn(
          'inline-flex min-w-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/30 disabled:opacity-50',
          fullWidth && 'w-full',
        )}
      >
        {trigger}
      </button>

      {open ? (
        <div
          className={cn(
            'absolute top-full z-50 mt-1 min-w-[12rem] overflow-hidden rounded-lg border border-devflow-border bg-devflow-surface shadow-devflow-md',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {searchable ? (
            <div className="border-b border-devflow-border p-2">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setHighlightIndex(0)
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-md border border-devflow-border bg-devflow-card px-2 py-1.5 text-input outline-none focus:border-devflow-primary"
              />
            </div>
          ) : null}

          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-caption text-devflow-text-muted">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => (
                <li key={option.id} role="option" aria-selected={index === highlightIndex}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option.id)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-body text-devflow-text disabled:opacity-40',
                      index === highlightIndex && 'bg-[var(--df-nav-tint)]/40',
                    )}
                  >
                    {option.icon}
                    <span className="min-w-0 truncate">{option.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {footer ? (
            <div className="border-t border-devflow-border p-2">{footer}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
