import { History, Rocket } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { layout } from '@/constants/layout'
import { cn } from '@/utils/cn'

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

type ActivityFeedProps = {
  variant?: 'default' | 'secondary'
  activities?: {
    id: string
    actor: string | null
    event_type: string
    issue?: { key?: string; title?: string } | null
    project?: { name?: string } | null
    timestamp: string
  }[] | null
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

export function ActivityFeed({
  variant = 'default',
  activities = null,
  isLoading = false,
  error = null,
  onRetry,
}: ActivityFeedProps) {
  const isSecondary = variant === 'secondary'

  const renderContent = () => {
    if (isLoading) {
      return (
        <ul className={cn('flex flex-col', isSecondary ? 'gap-3' : 'gap-4')}>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex gap-2.5">
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
        <div className="text-caption text-devflow-text-secondary">No recent activity</div>
      )
    }

    return (
      <ul className={cn('flex flex-col', isSecondary ? 'gap-3' : 'gap-4')}>
        {activities.map((a) => (
          <li key={a.id} className="flex gap-2.5">
            <ActivityAvatar
              type={a.actor ? 'user' : 'system'}
              value={a.actor ?? 'System'}
            />
            <div className="min-w-0 flex-1">
              <p className={cn('text-devflow-text', isSecondary ? 'text-caption leading-snug' : 'text-body')}>
                <span className="font-medium">{a.actor ?? 'System'}</span>
                <span className="font-normal text-devflow-text-secondary">{' '}{a.event_type.replace(/_/g, ' ')}{' '}</span>
                {a.issue && a.issue.key && (
                  <span className="rounded bg-[var(--df-activity-highlight)] px-0.5 font-mono text-[11px] text-devflow-primary">{a.issue.key}</span>
                )}
                {a.project && (
                  <span className="font-normal text-devflow-text-secondary">{' '}in {a.project.name}</span>
                )}
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-devflow-text-muted">{a.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <aside
      className={cn(
        'w-full shrink-0',
        isSecondary
          ? 'pt-1 lg:w-[15.5rem] xl:w-[14.5rem]'
          : 'pt-1 lg:w-72',
      )}
    >
      <div
        className={cn(
          layout.uiCard,
          isSecondary && 'border-devflow-border/70 bg-devflow-muted/30 p-2.5 shadow-none',
        )}
      >
        <div
          className={cn(
            'mb-3 flex items-center gap-2',
            isSecondary && 'mb-2.5',
          )}
        >
          <History
            className={cn(
              'text-devflow-text-muted',
              isSecondary ? 'size-4' : 'size-[18px] text-devflow-text-secondary',
            )}
          />
          <h3
            className={cn(
              isSecondary
                ? 'text-body font-medium text-devflow-text-secondary'
                : 'text-section-title text-devflow-text',
            )}
          >
            Recent Activity
          </h3>
        </div>

        {renderContent()}

        <button
          type="button"
          className={cn(
            'mt-3 w-full text-center text-btn text-devflow-primary hover:underline',
            isSecondary && 'mt-2.5 text-caption',
          )}
        >
          View all activity
        </button>
      </div>
    </aside>
  )
}
