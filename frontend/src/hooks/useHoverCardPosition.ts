import { useLayoutEffect, useMemo, useState } from 'react'

const CARD_WIDTH = 280
const CARD_GAP = 8
const VIEWPORT_MARGIN = 12

export type HoverCardPlacement = {
  top: number
  left: number
  placement: 'top' | 'bottom'
}

export function useHoverCardPosition(
  anchorRect: DOMRect | null,
  open: boolean,
): HoverCardPlacement | null {
  const [placement, setPlacement] = useState<HoverCardPlacement | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRect) {
      setPlacement(null)
      return
    }

    const cardHeightEstimate = 200
    const spaceBelow = window.innerHeight - anchorRect.bottom - VIEWPORT_MARGIN
    const spaceAbove = anchorRect.top - VIEWPORT_MARGIN
    const showBelow =
      spaceBelow >= cardHeightEstimate || spaceBelow >= spaceAbove

    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, anchorRect.left + anchorRect.width / 2 - CARD_WIDTH / 2),
      window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN,
    )

    if (showBelow) {
      setPlacement({
        top: anchorRect.bottom + CARD_GAP,
        left,
        placement: 'bottom',
      })
      return
    }

    setPlacement({
      top: anchorRect.top - CARD_GAP,
      left,
      placement: 'top',
    })
  }, [anchorRect, open])

  return useMemo(() => placement, [placement])
}

export const HOVER_CARD_WIDTH = CARD_WIDTH
