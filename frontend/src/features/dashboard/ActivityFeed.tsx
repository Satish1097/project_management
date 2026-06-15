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
  /** Secondary panel on projects list — narrower and lower visual weight */
  variant?: 'default' | 'secondary'
}

export function ActivityFeed({ variant = 'default' }: ActivityFeedProps) {
  const isSecondary = variant === 'secondary'

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

        <ul className={cn('flex flex-col', isSecondary ? 'gap-3' : 'gap-4')}>
          <li className="flex gap-2.5">
            <ActivityAvatar type="initials" value="SA" />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-devflow-text',
                  isSecondary ? 'text-caption leading-snug' : 'text-body',
                )}
              >
                <span className="font-medium">Sarah</span>
                <span className="font-normal text-devflow-text-secondary">
                  {' '}
                  moved{' '}
                </span>
                <span className="rounded bg-[var(--df-activity-highlight)] px-0.5 font-mono text-[11px] text-devflow-primary">
                  DF-42
                </span>
                <span className="font-normal text-devflow-text-secondary">
                  {' '}
                  to{' '}
                </span>
                <span className="font-medium text-devflow-success">Done</span>
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-devflow-text-muted">
                2m ago
              </p>
            </div>
          </li>

          <li className="flex gap-2.5">
            <ActivityAvatar type="user" value="David" color="#6366f1" />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-devflow-text',
                  isSecondary ? 'text-caption leading-snug' : 'text-body',
                )}
              >
                <span className="font-medium">David</span>
                <span className="font-normal text-devflow-text-secondary">
                  {' '}
                  commented on Auth Refactor
                </span>
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-devflow-text-muted">
                1h ago
              </p>
            </div>
          </li>

          <li className="flex gap-2.5">
            <ActivityAvatar type="system" value="" />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  isSecondary ? 'text-caption leading-snug' : 'text-body',
                )}
              >
                <span className="font-medium text-devflow-primary">System</span>
                <span className="text-devflow-text-secondary">
                  {' '}
                  deployed v2.4.0-rc1
                </span>
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-devflow-text-muted">
                4h ago
              </p>
            </div>
          </li>
        </ul>

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
