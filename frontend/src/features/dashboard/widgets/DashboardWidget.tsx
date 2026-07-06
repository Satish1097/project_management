import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'

type DashboardWidgetProps = {
  title: string
  icon?: ReactNode
  viewAllTo?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  /** When true, body grows to fill a fixed-height parent (e.g. scrollable panels). */
  fill?: boolean
}

export function DashboardWidget({
  title,
  icon,
  viewAllTo,
  action,
  children,
  className,
  bodyClassName,
  fill = false,
}: DashboardWidgetProps) {
  return (
    <section className={cn(layout.uiCard, 'flex flex-col', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="truncate text-card-title text-devflow-text">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {viewAllTo ? (
            <Link
              to={viewAllTo}
              className="inline-flex items-center gap-0.5 text-caption font-medium text-devflow-primary hover:underline"
            >
              View all
              <ArrowRight className="size-3" />
            </Link>
          ) : null}
        </div>
      </div>
      <div className={cn(fill ? 'min-h-0 flex-1' : '', bodyClassName)}>{children}</div>
    </section>
  )
}
