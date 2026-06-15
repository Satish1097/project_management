import { useCallback, useRef, type KeyboardEvent } from 'react'

/** Opens detail on click/keyboard without firing after a drag operation. */
export function useIssueCardClick(onOpen: () => void) {
  const draggedRef = useRef(false)

  const onDragStart = useCallback(() => {
    draggedRef.current = true
  }, [])

  const onDragEnd = useCallback(() => {
    requestAnimationFrame(() => {
      draggedRef.current = false
    })
  }, [])

  const onClick = useCallback(() => {
    if (!draggedRef.current) onOpen()
  }, [onOpen])

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onOpen()
      }
    },
    [onOpen],
  )

  return { onDragStart, onDragEnd, onClick, onKeyDown }
}
