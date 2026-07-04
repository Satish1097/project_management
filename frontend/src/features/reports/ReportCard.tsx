import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'

type ReportCardProps = {
  title: string
  description: string
  icon: LucideIcon
  status: 'available' | 'coming-soon'
  to?: string
}

export function ReportCard({
  title,
  description,
  icon: Icon,
  status,
  to,
}: ReportCardProps) {
  const isAvailable = status === 'available'
  const isLink = isAvailable && to != null

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-devflow-surface">
          <Icon
            className={cn(
              'size-4',
              isAvailable ? 'text-devflow-primary' : 'text-devflow-text-muted',
            )}
          />
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-caption-label',
            isAvailable
              ? 'bg-[var(--df-success-tint)] text-devflow-success'
              : 'bg-devflow-pill text-devflow-text-muted',
          )}
        >
          {isAvailable ? 'Available' : 'Coming Soon'}
        </span>
      </div>
      <h3 className="mt-3 text-section-title text-devflow-text">{title}</h3>
      <p className="mt-1 text-body text-devflow-text-secondary">{description}</p>
    </>
  )

  if (isLink) {
    return (
      <Link
        to={to}
        className={cn(
          layout.uiCard,
          'block transition-opacity hover:border-devflow-primary/40 hover:bg-devflow-surface/40',
        )}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        isAvailable ? layout.uiCard : layout.uiCardMuted,
        !isAvailable && 'opacity-90',
      )}
      aria-disabled={!isAvailable}
    >
      {content}
    </div>
  )
}
