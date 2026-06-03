import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { notificationIconMap } from './notificationIcons'
import {
  NOTIFICATION_TABS,
  filterNotifications,
  getTabBadgeCount,
} from './notificationUtils'
import { useNotifications } from './NotificationProvider'

type NotificationPanelProps = {
  className?: string
}

export function NotificationPanel({ className }: NotificationPanelProps) {
  const {
    notifications,
    activeTab,
    setActiveTab,
    unreadCount,
    mentionUnreadCount,
    markAllRead,
    markRead,
  } = useNotifications()

  const filtered = filterNotifications(notifications, activeTab)

  return (
    <div
      className={cn(
        'flex min-h-[min(720px,calc(100vh-var(--height-header)-4rem))] flex-col overflow-hidden rounded-xl border border-[#e3e6ed] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]',
        className,
      )}
      role="region"
      aria-label="Notifications"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e8eaef] px-6 py-4">
        <h2 className="text-[16px] font-semibold leading-none text-devflow-text">
          Notifications
        </h2>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0}
          className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#004191] transition-colors hover:bg-[rgba(0,65,145,0.06)] disabled:cursor-default disabled:opacity-40"
        >
          Mark all read
        </button>
      </header>

      <nav
        className="flex shrink-0 items-center gap-0.5 border-b border-[#e8eaef] px-6"
        role="tablist"
      >
        {NOTIFICATION_TABS.map((tab) => {
          const badge = getTabBadgeCount(tab.id, unreadCount, mentionUnreadCount)
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative -mb-px flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium leading-none transition-colors',
                isActive
                  ? 'text-[#004191]'
                  : 'text-devflow-text-muted hover:text-devflow-text-secondary',
              )}
            >
              {tab.label}
              {badge != null && (
                <span
                  className={cn(
                    'inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums',
                    isActive
                      ? 'bg-[#004191] text-white'
                      : 'bg-[#e8eaef] text-devflow-text-secondary',
                  )}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[#004191]"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </nav>

      <ul className="flex-1 overflow-y-auto overscroll-contain">
        {filtered.length === 0 ? (
          <li className="px-4 py-10 text-center text-[13px] text-devflow-text-muted">
            No notifications here
          </li>
        ) : (
          filtered.map((n) => {
            const Icon = notificationIconMap[n.type]
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'grid w-full min-h-[80px] grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-[#eef0f4] px-5 py-4 text-left transition-colors sm:px-6',
                    'hover:bg-[#fafbfc] focus-visible:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#004191]/30',
                    n.unread && 'bg-[#f7fafc]',
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar name={n.user} color={n.color} size={38} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-[#eef0f4] text-devflow-text-muted"
                      aria-hidden
                    >
                      <Icon className="size-2.5" strokeWidth={2.25} />
                    </span>
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-[14px] font-semibold leading-snug text-devflow-text">
                      {n.user}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[1.45] text-devflow-text-secondary">
                      {n.message}
                    </p>
                    {n.project && (
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-devflow-text-muted">
                        {n.project}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                    <time
                      className="text-[11px] leading-none text-devflow-text-muted tabular-nums"
                      dateTime={n.time}
                    >
                      {n.time}
                    </time>
                    {n.unread && (
                      <span
                        className="size-2 rounded-full bg-[#004191]"
                        aria-label="Unread"
                      />
                    )}
                  </div>
                </button>
              </li>
            )
          })
        )}
      </ul>

      <footer className="flex shrink-0 flex-col gap-2 border-t border-[#e8eaef] px-6 py-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-devflow-text-secondary transition-colors hover:bg-[#f2f4f6] hover:text-devflow-text"
        >
          <Check className="size-3.5" strokeWidth={2} />
          Notification preferences
        </button>
        <Link
          to={ROUTES.notifications}
          className="text-[12px] font-medium text-[#004191] hover:underline"
        >
          View all notifications
        </Link>
      </footer>
    </div>
  )
}
