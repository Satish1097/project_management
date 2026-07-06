import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { UserProfileCardContent } from '@/components/ui/UserProfileCardContent'
import {
  HOVER_CARD_WIDTH,
  useHoverCardPosition,
} from '@/hooks/useHoverCardPosition'
import { useUserProfile } from '@/hooks/useUserProfile'
import type { UserProfileInput } from '@/types/userProfile'
import { cn } from '@/utils/cn'

const OPEN_DELAY_MS = 350
const CLOSE_DELAY_MS = 180

type UserHoverCardProps = {
  children: ReactNode
  profile: UserProfileInput
  projectId?: string
  disabled?: boolean
  className?: string
}

export function UserHoverCard({
  children,
  profile,
  projectId,
  disabled = false,
  className,
}: UserHoverCardProps) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const openTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const resolvedProfile = useUserProfile(
    disabled ? null : profile.userId ? profile : open ? profile : null,
    projectId,
  )
  const placement = useHoverCardPosition(anchorRect, open)

  const clearTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const scheduleOpen = useCallback(() => {
    clearTimers()
    openTimerRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        setAnchorRect(triggerRef.current.getBoundingClientRect())
      }
      setOpen(true)
    }, OPEN_DELAY_MS)
  }, [clearTimers])

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
    }, CLOSE_DELAY_MS)
  }, [clearTimers])

  const handleEnter = useCallback(() => {
    if (disabled) return
    scheduleOpen()
  }, [disabled, scheduleOpen])

  const handleLeave = useCallback(() => {
    scheduleClose()
  }, [scheduleClose])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    setAnchorRect(triggerRef.current.getBoundingClientRect())
  }, [open])

  useEffect(() => {
    if (!open) return

    const updatePosition = () => {
      if (triggerRef.current) {
        setAnchorRect(triggerRef.current.getBoundingClientRect())
      }
    }

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => clearTimers, [clearTimers])

  const card =
    open && placement && resolvedProfile
      ? createPortal(
          <div
            ref={cardRef}
            className={cn(
              'fixed z-[150] transition-opacity duration-150',
              placement.placement === 'top' && '-translate-y-full',
            )}
            style={{
              top: placement.top,
              left: placement.left,
              width: HOVER_CARD_WIDTH,
            }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            role="tooltip"
            aria-label={`${resolvedProfile.displayName} profile`}
          >
            <UserProfileCardContent profile={resolvedProfile} />
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex shrink-0', className)}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        {children}
      </span>
      {card}
    </>
  )
}
