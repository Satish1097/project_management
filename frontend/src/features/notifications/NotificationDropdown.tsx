import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import { NotificationDropdownPanel } from './NotificationDropdownPanel'
import { useNotifications } from './NotificationProvider'

type NotificationDropdownProps = {
  anchorRect: DOMRect
}

const DROPDOWN_WIDTH = 448
const GAP_BELOW_BELL = 8
const VIEWPORT_MARGIN = 16
const CARET_SIZE = 10

export function NotificationDropdown({ anchorRect }: NotificationDropdownProps) {
  const { close, isOpen } = useNotifications()
  const [visible, setVisible] = useState(false)

  useLayoutEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(frame)
    }
    setVisible(false)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  const layout = useMemo(() => {
    const panelWidth = Math.min(DROPDOWN_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2)
    const top = anchorRect.bottom + GAP_BELOW_BELL + CARET_SIZE
    const right = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - anchorRect.right,
    )
    const bellCenterFromViewportRight =
      window.innerWidth - (anchorRect.left + anchorRect.width / 2)
    const caretRight = Math.min(
      panelWidth - CARET_SIZE - 4,
      Math.max(CARET_SIZE + 4, bellCenterFromViewportRight - right - CARET_SIZE / 2),
    )
    const maxHeight = Math.min(
      window.innerHeight * 0.72,
      window.innerHeight - top - VIEWPORT_MARGIN,
    )

    return { panelWidth, top, right, maxHeight, caretRight }
  }, [anchorRect])

  if (!isOpen) return null

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[90] cursor-default bg-transparent"
        aria-label="Close notifications"
        onClick={close}
      />
      <div
        className={cn(
          'fixed z-[100] transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          visible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        style={{
          top: layout.top - CARET_SIZE,
          right: layout.right,
          width: layout.panelWidth,
        }}
      >
        <div
          className={cn(
            'relative transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
            visible ? 'translate-y-0 scale-100' : '-translate-y-1 scale-[0.98]',
            'origin-top-right',
          )}
        >
          <div
            className="pointer-events-none absolute top-0 z-[1] size-0"
            style={{ right: layout.caretRight }}
            aria-hidden
          >
            <div
              className="absolute left-1/2 size-0 -translate-x-1/2 border-x-[10px] border-b-[10px] border-x-transparent border-b-[#e5e7eb]"
              style={{ top: 0 }}
            />
            <div
              className="absolute left-1/2 size-0 -translate-x-1/2 border-x-[9px] border-b-[9px] border-x-transparent border-b-white"
              style={{ top: 1 }}
            />
          </div>

          <NotificationDropdownPanel
            onClose={close}
            maxHeight={layout.maxHeight}
          />
        </div>
      </div>
    </>,
    document.body,
  )
}
