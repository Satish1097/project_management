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
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--df-activity-accent)] text-white">
        <Rocket className="size-3" />
      </div>
    )
  }

  if (type === 'initials') {
    return (
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full border border-devflow-border text-caption font-semibold text-devflow-text-secondary',
          color ?? 'bg-devflow-avatar-bg',
        )}
      >
        {value}
      </div>
    )
  }

  return <Avatar name={value} color={color ?? '#94a3b8'} size={28} />
}

export function ActivityFeed() {
  return (
    <aside className="w-full shrink-0 pt-1 lg:w-72">
      <div className={layout.uiCard}>
        <div className="mb-4 flex items-center gap-2">
          <History className="size-[18px] text-devflow-text-secondary" />
          <h3 className="text-section-title text-devflow-text">
            Recent Activity
          </h3>
        </div>

        <ul className="flex flex-col gap-4">
          <li className="flex gap-3">
            <ActivityAvatar type="initials" value="SA" />
            <div className="min-w-0 flex-1">
              <p className="text-body text-devflow-text">
                <span className="font-semibold">Sarah</span>
                <span className="font-normal"> moved </span>
                <span className="rounded bg-[var(--df-activity-highlight)] px-1 font-mono text-devflow-primary">
                  DF-42
                </span>
                <span className="font-normal"> to </span>
                <span className="font-semibold text-devflow-success">Done</span>
              </p>
              <p className="mt-1 font-mono text-caption uppercase leading-[15px] text-devflow-text-muted">
                2 minutes ago
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <ActivityAvatar type="user" value="David" color="#6366f1" />
            <div className="min-w-0 flex-1">
              <p className="text-body text-devflow-text">
                <span className="font-semibold">David</span>
                <span className="font-normal"> commented on </span>
                <span className="italic text-devflow-text-secondary">
                  &quot;Auth Refactor&quot;
                </span>
              </p>
              <p className="mt-1 font-mono text-caption uppercase leading-[15px] text-devflow-text-muted">
                1 hour ago
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <ActivityAvatar type="system" value="" />
            <div className="min-w-0 flex-1">
              <p className="text-body">
                <span className="font-semibold text-devflow-primary">System</span>
                <span className="text-devflow-text">
                  {' '}
                  deployed <span className="font-semibold">v2.4.0-rc1</span> to
                  Production
                </span>
              </p>
              <p className="mt-1 font-mono text-caption uppercase leading-[15px] text-devflow-text-muted">
                4 hours ago
              </p>
            </div>
          </li>

          <li className="flex gap-3">
            <ActivityAvatar type="user" value="Elena" color="#ec4899" />
            <div className="min-w-0 flex-1">
              <p className="text-body text-devflow-text">
                <span className="font-semibold">Elena</span>
                <span className="font-normal">
                  {' '}
                  added 3 new designs to Marketing Site
                </span>
              </p>
              <p className="mt-1 font-mono text-caption uppercase leading-[15px] text-devflow-text-muted">
                Yesterday
              </p>
            </div>
          </li>
        </ul>

        <button
          type="button"
          className="mt-4 w-full text-center text-btn leading-normal text-devflow-primary hover:underline"
        >
          View All Activity
        </button>
      </div>
    </aside>
  )
}
