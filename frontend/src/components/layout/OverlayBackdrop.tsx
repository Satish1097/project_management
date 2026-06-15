import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'

type OverlayBackdropProps = {
  children: ReactNode
  closeTo: string
  className?: string
}

export function OverlayBackdrop({
  children,
  closeTo,
  className,
}: OverlayBackdropProps) {
  return (
    <div className="relative min-h-screen bg-devflow-surface">
      <div className="pointer-events-none fixed inset-0 ml-60 bg-black/20 backdrop-blur-[1px]" />
      <Link
        to={closeTo}
        className="fixed right-6 top-20 z-50 flex size-10 items-center justify-center rounded-full bg-devflow-card text-devflow-text-secondary shadow-md hover:bg-devflow-surface"
        aria-label="Close"
      >
        <X className="size-5" />
      </Link>
      <div className={className ?? 'relative z-40'}>{children}</div>
    </div>
  )
}
