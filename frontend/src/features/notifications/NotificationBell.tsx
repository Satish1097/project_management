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
            ? 'border-[#d4dce8] bg-[#eef2f7] text-[#004191]'
            : 'border-[#e8eaef] bg-[#f5f6f8] text-[#5c6370] hover:border-[#d8dce3] hover:bg-[#eef0f3] hover:text-[#374151]',
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
              'pointer-events-none absolute flex items-center justify-center rounded-full bg-[#e53935] font-bold leading-none text-white ring-2 ring-[#f5f6f8]',
              isOpen && 'ring-[#eef2f7]',
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
