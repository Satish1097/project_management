import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useFloatingDropdownPosition } from '@/hooks/useFloatingDropdownPosition'
import { cn } from '@/utils/cn'

export type InlineDropdownOption = {
  id: string
  label: string
  description?: string
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
  selectedOptionId?: string
  minWidth?: number
  maxHeight?: number
}

const DROPDOWN_Z_INDEX = 120

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
  selectedOptionId,
  minWidth = 192,
  maxHeight = 224,
}: InlineDropdownProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const setOpenState = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
      if (!next) {
        setQuery('')
        setHighlightIndex(0)
        setAnchorRect(null)
      }
    },
    [onOpenChange],
  )

  useClickOutside([triggerRef, panelRef], () => setOpenState(false), open)

  const placement = useFloatingDropdownPosition(anchorRect, open, {
    align,
    minWidth,
    maxHeight,
  })

  const updateAnchorRect = useCallback(() => {
    if (triggerRef.current) {
      setAnchorRect(triggerRef.current.getBoundingClientRect())
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updateAnchorRect()
  }, [open, updateAnchorRect])

  useEffect(() => {
    if (!open) return

    window.addEventListener('scroll', updateAnchorRect, true)
    window.addEventListener('resize', updateAnchorRect)
    return () => {
      window.removeEventListener('scroll', updateAnchorRect, true)
      window.removeEventListener('resize', updateAnchorRect)
    }
  }, [open, updateAnchorRect])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const filtered = options.filter((option) => {
    if (!searchable || !query.trim()) return true
    const q = query.trim().toLowerCase()
    return (
      option.label.toLowerCase().includes(q) ||
      option.description?.toLowerCase().includes(q) ||
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

  const panel =
    open && placement
      ? createPortal(
          <div
            ref={panelRef}
            className={cn(
              'fixed overflow-hidden rounded-lg border border-devflow-border bg-devflow-surface shadow-devflow-md',
              placement.placement === 'top' && '-translate-y-full',
              panelClassName,
            )}
            style={{
              top: placement.top,
              left: placement.left,
              width: placement.minWidth,
              zIndex: DROPDOWN_Z_INDEX,
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleKeyDown}
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
              className="overflow-y-auto py-1"
              style={{ maxHeight: placement.maxHeight }}
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
                        'flex w-full min-h-[2.5rem] items-center gap-2.5 px-3 py-2 text-left transition-colors',
                        'text-body text-devflow-text disabled:opacity-40',
                        index === highlightIndex && 'bg-[var(--df-nav-tint)]/40',
                        selectedOptionId === option.id &&
                          index !== highlightIndex &&
                          'bg-[var(--df-nav-tint)]/20',
                      )}
                    >
                      {option.icon ? (
                        <span className="flex shrink-0 items-center">{option.icon}</span>
                      ) : null}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body text-devflow-text">
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="block truncate text-caption text-devflow-text-muted">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            {footer ? (
              <div className="border-t border-devflow-border p-2">{footer}</div>
            ) : null}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        className={cn('relative', fullWidth ? 'flex w-full min-w-0' : 'inline-flex', className)}
        onKeyDown={handleKeyDown}
      >
        <button
          ref={triggerRef}
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
            'relative z-0 inline-flex min-w-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/30 disabled:opacity-50',
            fullWidth && 'w-full',
          )}
        >
          {trigger}
        </button>
      </div>
      {panel}
    </>
  )
}
