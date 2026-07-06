import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { notificationIconMap } from './notificationIcons'
import {
  NOTIFICATION_TABS,
  filterNotifications,
  formatNotificationCreatedAt,
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
    isLoading,
    error,
    unreadCount,
    mentionUnreadCount,
    markAllRead,
    markRead,
    reload,
  } = useNotifications()

  const filtered = filterNotifications(notifications, activeTab)

  return (
    <div
      className={cn(
        'flex min-h-[min(720px,calc(100vh-var(--height-header)-4rem))] flex-col overflow-hidden rounded-xl border border-devflow-panel-border bg-devflow-card shadow-devflow-drawer',
        className,
      )}
      role="region"
      aria-label="Notifications"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-devflow-panel-border px-6 py-4">
        <h2 className="text-[16px] font-semibold leading-none text-devflow-text">
          Notifications
        </h2>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={unreadCount === 0}
          className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-devflow-brand transition-colors hover:bg-[var(--df-brand-tint-hover)] disabled:cursor-default disabled:opacity-40"
        >
          Mark all read
        </button>
      </header>

      <nav
        className="flex shrink-0 items-center gap-0.5 border-b border-devflow-panel-border px-6"
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
                  ? 'text-devflow-brand'
                  : 'text-devflow-text-muted hover:text-devflow-text-secondary',
              )}
            >
              {tab.label}
              {badge != null && (
                <span
                  className={cn(
                    'inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums',
                    isActive
                      ? 'bg-devflow-brand-deep text-white'
                      : 'bg-devflow-panel-border text-devflow-text-secondary',
                  )}
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {isActive && (
                <span
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-devflow-brand-deep"
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </nav>

      <ul className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <li className="px-4 py-10 text-center text-[13px] text-devflow-text-muted">
            Loading notifications...
          </li>
        ) : error ? (
          <li className="px-4 py-10 text-center">
            <p className="text-[13px] text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-2 text-[12px] font-medium text-devflow-brand hover:underline"
            >
              Retry
            </button>
          </li>
        ) : filtered.length === 0 ? (
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
                  onClick={() => void markRead(n.id)}
                  className={cn(
                    'grid w-full min-h-[80px] grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-devflow-panel-divider-soft px-5 py-4 text-left transition-colors sm:px-6',
                    'hover:bg-devflow-panel-hover focus-visible:bg-devflow-panel-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-devflow-brand/30',
                    n.unread && 'bg-devflow-panel-row-unread-alt',
                  )}
                >
                  <div className="relative shrink-0">
                    <UserAvatar name={n.title} color={n.color} size={38} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex size-[18px] items-center justify-center rounded-full border-2 border-devflow-card bg-devflow-bell-bg text-devflow-text-muted"
                      aria-hidden
                    >
                      <Icon className="size-2.5" strokeWidth={2.25} />
                    </span>
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-[14px] font-semibold leading-snug text-devflow-text">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-[1.45] text-devflow-text-secondary">
                      {n.message}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
                    <time
                      className="text-[11px] leading-none text-devflow-text-muted tabular-nums"
                      dateTime={n.createdAt}
                    >
                      {formatNotificationCreatedAt(n.createdAt)}
                    </time>
                    {n.unread && (
                      <span
                        className="size-2 rounded-full bg-devflow-brand-deep"
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

      <footer className="flex shrink-0 flex-col gap-2 border-t border-devflow-panel-border px-6 py-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-medium text-devflow-text-secondary transition-colors hover:bg-devflow-muted hover:text-devflow-text"
        >
          <Check className="size-3.5" strokeWidth={2} />
          Notification preferences
        </button>
        <Link
          to={ROUTES.notifications}
          className="text-[12px] font-medium text-devflow-brand hover:underline"
        >
          View all notifications
        </Link>
      </footer>
    </div>
  )
}
