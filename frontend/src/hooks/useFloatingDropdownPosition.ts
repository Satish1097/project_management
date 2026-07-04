import { useLayoutEffect, useMemo, useState } from 'react'

const DEFAULT_MIN_WIDTH = 192
const DEFAULT_GAP = 4
const DEFAULT_VIEWPORT_MARGIN = 8
const DEFAULT_MAX_HEIGHT = 224

export type FloatingDropdownPlacement = {
  top: number
  left: number
  maxHeight: number
  minWidth: number
  placement: 'top' | 'bottom'
}

type UseFloatingDropdownPositionOptions = {
  align?: 'left' | 'right'
  minWidth?: number
  maxHeight?: number
  gap?: number
  viewportMargin?: number
}

export function useFloatingDropdownPosition(
  anchorRect: DOMRect | null,
  open: boolean,
  {
    align = 'left',
    minWidth = DEFAULT_MIN_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    gap = DEFAULT_GAP,
    viewportMargin = DEFAULT_VIEWPORT_MARGIN,
  }: UseFloatingDropdownPositionOptions = {},
): FloatingDropdownPlacement | null {
  const [placement, setPlacement] = useState<FloatingDropdownPlacement | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchorRect) {
      setPlacement(null)
      return
    }

    const panelWidth = Math.min(
      minWidth,
      window.innerWidth - viewportMargin * 2,
    )

    let left =
      align === 'right'
        ? anchorRect.right - panelWidth
        : anchorRect.left

    left = Math.min(
      Math.max(viewportMargin, left),
      window.innerWidth - panelWidth - viewportMargin,
    )

    const spaceBelow =
      window.innerHeight - anchorRect.bottom - gap - viewportMargin
    const spaceAbove = anchorRect.top - gap - viewportMargin
    const showBelow = spaceBelow >= maxHeight || spaceBelow >= spaceAbove

    if (showBelow) {
      setPlacement({
        top: anchorRect.bottom + gap,
        left,
        maxHeight: Math.min(maxHeight, Math.max(120, spaceBelow)),
        minWidth: panelWidth,
        placement: 'bottom',
      })
      return
    }

    const availableAbove = Math.max(120, spaceAbove)
    setPlacement({
      top: anchorRect.top - gap,
      left,
      maxHeight: Math.min(maxHeight, availableAbove),
      minWidth: panelWidth,
      placement: 'top',
    })
  }, [
    align,
    anchorRect,
    gap,
    maxHeight,
    minWidth,
    open,
    viewportMargin,
  ])

  return useMemo(() => placement, [placement])
}
