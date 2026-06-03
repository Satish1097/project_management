import type { ReactNode } from 'react'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'

type MetricCardProps = {
  label: string
  value: string
  sub?: string
  badge?: { text: string; variant?: 'success' | 'warning' | 'danger' }
  progress?: number
  footer?: string
  icon?: ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  sub,
  badge,
  progress,
  footer,
  icon,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        layout.uiCard,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-label text-devflow-text-secondary">
          {label}
        </span>
        {badge && (
          <span
            className={cn(
              'rounded px-2 py-0.5 text-caption-label',
              badge.variant === 'success' && 'bg-[rgba(16,185,129,0.1)] text-[#10b981]',
              badge.variant === 'warning' && 'bg-[rgba(180,83,9,0.1)] text-[#b45309]',
              badge.variant === 'danger' && 'bg-[#ffdad6] text-[#ba1a1a]',
              !badge.variant && 'bg-[#e6e8ea] text-devflow-text-secondary',
            )}
          >
            {badge.text}
          </span>
        )}
        {icon}
      </div>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-metric text-devflow-text">{value}</span>
        {sub && (
          <span className="pb-1 text-caption text-devflow-text-secondary">{sub}</span>
        )}
      </div>
      {progress !== undefined && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eceef0]">
          <div
            className="h-full rounded-full bg-[#10b981]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {footer && (
        <p className="mt-2 text-caption text-devflow-text-secondary">{footer}</p>
      )}
    </div>
  )
}
