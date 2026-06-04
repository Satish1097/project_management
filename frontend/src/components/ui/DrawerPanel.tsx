import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

type DrawerPanelProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** Wider drawer for complex forms (e.g. create issue). */
  size?: 'default' | 'wide'
}

export function DrawerPanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  size = 'default',
}: DrawerPanelProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] transition-opacity dark:bg-black/50"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'drawer-panel-enter relative flex h-full w-full flex-col border-l border-devflow-border bg-devflow-card shadow-devflow-drawer',
          size === 'wide' ? 'max-w-[32rem]' : 'max-w-[28rem]',
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-devflow-border px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-section-title font-semibold text-devflow-text"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-caption text-devflow-text-muted">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-devflow-text-secondary transition-colors hover:bg-devflow-surface"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-devflow-border bg-devflow-card px-5 py-4">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  )
}
