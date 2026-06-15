import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/utils/cn'
import { NotificationDropdown } from './NotificationDropdown'
import { useNotifications } from './NotificationProvider'

type NotificationBellProps = {
  className?: string
  iconClassName?: string
}

export function NotificationBell({
  className,
  iconClassName,
}: NotificationBellProps) {
  const { isOpen, toggle, unreadCount } = useNotifications()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const updateAnchor = useCallback(() => {
    if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect())
    }
  }, [])

  const handleClick = () => {
    updateAnchor()
    toggle()
  }

  useEffect(() => {
    if (!isOpen) return

    updateAnchor()
    window.addEventListener('resize', updateAnchor)
    window.addEventListener('scroll', updateAnchor, true)

    return () => {
      window.removeEventListener('resize', updateAnchor)
      window.removeEventListener('scroll', updateAnchor, true)
    }
  }, [isOpen, updateAnchor])

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className={cn(
          'relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors',
          isOpen
            ? 'border-devflow-bell-border-active bg-devflow-bell-bg-active text-devflow-brand'
            : 'border-devflow-panel-border bg-devflow-bell-bg text-devflow-bell-text hover:border-devflow-bell-hover-border hover:bg-devflow-bell-hover-bg hover:text-devflow-text-secondary',
          className,
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell
          className={cn('size-[18px]', iconClassName)}
          strokeWidth={isOpen ? 2.25 : 1.75}
        />
        {unreadCount > 0 && (
          <span
            className={cn(
              'pointer-events-none absolute flex items-center justify-center rounded-full bg-devflow-badge font-bold leading-none text-white ring-2 ring-devflow-bell-ring',
              isOpen && 'ring-devflow-bell-ring-active',
              badgeLabel.length > 1
                ? '-right-1 -top-1 h-[18px] min-w-[20px] px-0.5 text-[10px]'
                : '-right-1 -top-1 size-[18px] text-[11px]',
            )}
            aria-hidden
          >
            {badgeLabel}
          </span>
        )}
      </button>
      {anchorRect && isOpen && (
        <NotificationDropdown anchorRect={anchorRect} />
      )}
    </>
  )
}
