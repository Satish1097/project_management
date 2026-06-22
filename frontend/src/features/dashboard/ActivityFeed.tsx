import { History, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { layout } from '@/constants/layout'
import type { DashboardActivityApi } from '@/types/dashboard'
import { cn } from '@/utils/cn'
import { formatActivityAction, formatActivityTimestamp } from '@/utils/formatActivity'

function ActivityAvatar({
  type,
  value,
  color,
}: {
  type: 'initials' | 'user' | 'system'
  value: string
  color?: string
}) {
  if (type === 'system') {
    return (
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--df-activity-accent)] text-white">
        <Rocket className="size-3" />
      </div>
    )
  }

  if (type === 'initials') {
    return (
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full border border-devflow-border text-[11px] font-semibold text-devflow-text-secondary',
          color ?? 'bg-devflow-avatar-bg',
        )}
      >
        {value}
      </div>
    )
  }

  return <Avatar name={value} color={color ?? '#94a3b8'} size={26} />
}

type ActivityFeedPagination = {
  count: number
  next: string | null
  previous: string | null
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

type ActivityFeedProps = {
  variant?: 'default' | 'secondary' | 'full' | 'preview'
  embedded?: boolean
  activities?: DashboardActivityApi[] | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  viewAllTo?: string
  showProjectName?: boolean
  showSectionHeader?: boolean
  emptyMessage?: string
  emptyHelperText?: string
  pagination?: ActivityFeedPagination
}

export function ActivityFeed({
  variant = 'default',
  embedded = false,
  activities = null,
  isLoading = false,
  error = null,
  onRetry,
  viewAllTo,
  showProjectName = true,
  showSectionHeader = true,
  emptyMessage = 'No recent activity yet',
  emptyHelperText = 'Activity will appear here when issues, comments, sprint changes, or status updates occur.',
  pagination,
}: ActivityFeedProps) {
  const isSecondary = variant === 'secondary'
  const isPreview = variant === 'preview'
  const isFull = variant === 'full'
  const isCompact = isSecondary || isPreview

  const renderContent = () => {
    if (isLoading) {
      const skeletonCount = isPreview ? 5 : pagination?.pageSize ?? (isFull ? 10 : 3)
      return (
        <ul
          className={cn(
            'flex flex-col',
            isPreview && 'divide-y divide-[var(--df-border-faint)]',
            !isPreview && (isCompact ? 'gap-3' : 'gap-4'),
          )}
        >
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <li key={i} className={cn('flex gap-2.5', isPreview && 'py-2.5 first:pt-0 last:pb-0')}>
              <ActivityAvatar type="initials" value="" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-3/4 animate-pulse rounded bg-devflow-table-header" />
                <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-devflow-table-header" />
              </div>
            </li>
          ))}
        </ul>
      )
    }

    if (error) {
      return (
        <div className="space-y-2">
          <p className="text-caption text-devflow-error">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-btn text-devflow-primary hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      )
    }

    if (!activities || activities.length === 0) {
      return (
        <div className="space-y-1">
          <p className="text-caption text-devflow-text-secondary">{emptyMessage}</p>
          {emptyHelperText && (
            <p className="text-[11px] leading-snug text-devflow-text-muted">{emptyHelperText}</p>
          )}
        </div>
      )
    }

    return (
      <ul
        className={cn(
          'flex flex-col',
          isPreview && 'divide-y divide-[var(--df-border-faint)]',
          !isPreview && (isCompact ? 'gap-3' : 'gap-4'),
        )}
      >
        {activities.map((a) => (
          <li
            key={a.id}
            className={cn('flex gap-2.5', isPreview && 'py-2.5 first:pt-0 last:pb-0')}
          >
            <ActivityAvatar
              type={a.actor ? 'user' : 'system'}
              value={a.actor ?? 'System'}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-devflow-text',
                  isPreview && 'text-[13px] leading-snug',
                  !isPreview && (isCompact ? 'text-caption leading-snug' : 'text-body'),
                )}
              >
                <span className="font-medium">{a.actor ?? 'System'}</span>
                <span className="font-normal text-devflow-text-secondary">
                  {' '}
                  {formatActivityAction(a.event_type)}{' '}
                </span>
                {a.issue?.key && (
                  <span
                    className={cn(
                      'whitespace-nowrap rounded bg-[var(--df-activity-highlight)] px-0.5 font-mono text-[11px] text-devflow-primary',
                      isPreview && 'inline',
                    )}
                  >
                    {a.issue.key}
                  </span>
                )}
                {!isFull && showProjectName && a.project && (
                  <span className="font-normal text-devflow-text-secondary">
                    {' '}
                    in {a.project.name}
                  </span>
                )}
              </p>
              {isFull && showProjectName && a.project && (
                <p className="mt-0.5 text-[11px] text-devflow-text-secondary">
                  Project {a.project.name}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-devflow-text-muted">
                {formatActivityTimestamp(a.timestamp)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  const totalPages = pagination
    ? Math.max(1, Math.ceil(pagination.count / pagination.pageSize))
    : 1
  const rangeStart = pagination
    ? Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.count)
    : 0
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.count)
    : 0

  const content = (
    <>
      {!embedded && showSectionHeader && (
        <div
          className={cn(
            'mb-3 flex items-center justify-between gap-2',
            isSecondary && 'mb-2.5',
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <History
              className={cn(
                'shrink-0 text-devflow-text-muted',
                isSecondary ? 'size-4' : 'size-[18px] text-devflow-text-secondary',
              )}
            />
            <h3
              className={cn(
                'truncate',
                isSecondary
                  ? 'text-body font-medium text-devflow-text-secondary'
                  : 'text-section-title text-devflow-text',
              )}
            >
              Recent Activity
            </h3>
          </div>
          {!isFull && viewAllTo && (
            <Link
              to={viewAllTo}
              className={cn(
                'inline-flex shrink-0 items-center font-medium !text-devflow-primary hover:!text-devflow-primary-hover hover:underline',
                isSecondary ? 'text-caption' : 'text-btn',
              )}
            >
              View all →
            </Link>
          )}
        </div>
      )}

      {renderContent()}

      {pagination && pagination.count > 0 && (
        <div className="mt-4 space-y-2 border-t border-[var(--df-border-faint)] pt-3">
          <p className="text-caption text-devflow-text-secondary">
            Showing {rangeStart}-{rangeEnd} of {pagination.count} activities
          </p>
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={!pagination.previous}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="text-caption text-devflow-primary disabled:text-devflow-text-muted"
            >
              Previous
            </button>
            <span className="text-caption text-devflow-text-secondary">
              Page {pagination.page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={!pagination.next}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="text-caption text-devflow-primary disabled:text-devflow-text-muted"
            >
              Next
            </button>
          </div>
        </div>
      )}

    </>
  )

  if (embedded) {
    return content
  }

  return (
    <aside
      className={cn(
        'w-full shrink-0',
        isFull ? 'w-full' : isSecondary ? 'pt-1 lg:w-[15.5rem] xl:w-[14.5rem]' : 'pt-1 lg:w-72',
      )}
    >
      <div
        className={cn(
          layout.uiCard,
          isSecondary && 'border-devflow-border/70 bg-devflow-muted/30 p-2.5 shadow-none',
          isFull && 'w-full',
        )}
      >
        {content}
      </div>
    </aside>
  )
}
