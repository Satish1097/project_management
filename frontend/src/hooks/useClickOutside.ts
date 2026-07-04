import { useEffect, type RefObject } from 'react'

function isInsideRef(
  ref: RefObject<HTMLElement | null>,
  target: Node,
): boolean {
  return Boolean(ref.current?.contains(target))
}

export function useClickOutside(
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  onOutside: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return

    const refs = Array.isArray(ref) ? ref : [ref]

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (refs.some((item) => isInsideRef(item, target))) return
      onOutside()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [ref, onOutside, enabled])
}
