import { Link } from 'react-router-dom'
import { ChevronRight, Settings, X } from 'lucide-react'
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
import type { Notification } from './types'

const LIST_SCROLLBAR =
  'scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-devflow-scrollbar hover:[&::-webkit-scrollbar-thumb]:bg-devflow-scrollbar-hover'

type NotificationDropdownPanelProps = {
  onClose: () => void
  maxHeight: number
}

function DropdownHeader({
  unreadCount,
  onMarkAllRead,
  onClose,
}: {
  unreadCount: number
  onMarkAllRead: () => void
  onClose: () => void
}) {
  return (
    <header className="box-border flex h-[52px] shrink-0 items-center justify-between border-b border-devflow-panel-border bg-devflow-card px-5">
      <h2 className="text-[15px] font-semibold leading-none tracking-[-0.01em] text-devflow-text">
        Notifications
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-[13px] font-medium leading-none text-devflow-accent transition-colors hover:text-devflow-accent-hover disabled:pointer-events-none disabled:opacity-40"
        >
          Mark all read
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-devflow-text-muted transition-colors hover:bg-devflow-muted hover:text-devflow-icon-muted"
          aria-label="Close notifications"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}

function DropdownTabs({
  activeTab,
  unreadCount,
  mentionUnreadCount,
  onTabChange,
}: {
  activeTab: ReturnType<typeof useNotifications>['activeTab']
  unreadCount: number
  mentionUnreadCount: number
  onTabChange: ReturnType<typeof useNotifications>['setActiveTab']
}) {
  return (
    <nav
      className="box-border flex h-11 shrink-0 items-stretch gap-1 border-b border-devflow-panel-border bg-devflow-card px-4"
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
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex h-full items-center gap-1.5 px-3 text-[13px] font-medium leading-none transition-colors',
              isActive
                ? 'text-devflow-accent'
                : 'text-devflow-text-muted hover:text-devflow-icon-muted',
            )}
          >
            {tab.label}
            {badge != null && (
              <span
                className={cn(
                  'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none tabular-nums',
                  isActive
                    ? 'bg-devflow-accent text-white'
                    : 'bg-devflow-accent-muted-bg text-devflow-icon-muted',
                )}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            )}
            {isActive && (
              <span
                className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-devflow-accent"
                aria-hidden
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

function DropdownNotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const Icon = notificationIconMap[notification.type]

  return (
    <li>
      <button
        type="button"
        onClick={() => onMarkRead(notification.id)}
        className={cn(
          'box-border grid w-full grid-cols-[12px_40px_minmax(0,1fr)_56px] items-start gap-x-3 gap-y-0 border-b border-devflow-panel-divider px-4 py-3.5 text-left transition-colors duration-150',
          'hover:bg-devflow-panel-hover focus-visible:bg-devflow-panel-hover focus-visible:outline-none',
          notification.unread && 'bg-devflow-panel-row-unread',
        )}
      >
        <div className="flex justify-center pt-1.5">
          {notification.unread ? (
            <span
              className="size-2 shrink-0 rounded-full bg-devflow-accent"
              aria-label="Unread"
            />
          ) : (
            <span className="size-2 shrink-0" aria-hidden />
          )}
        </div>

        <Avatar
          name={notification.user}
          color={notification.color}
          size={36}
          className="mt-0.5"
        />

        <div className="min-w-0 overflow-hidden pt-0.5">
          <p className="text-[13px] leading-[1.35] text-devflow-text-secondary">
            <span className="font-semibold text-devflow-text">
              {notification.user}
            </span>{' '}
            <span className="font-normal">{notification.message}</span>
          </p>
          {notification.preview && (
            <p className="mt-0.5 truncate text-[13px] leading-[1.35] text-devflow-icon-muted">
              {notification.preview}
            </p>
          )}
          {notification.project && (
            <p className="mt-1 truncate text-[11px] leading-none text-devflow-text-muted">
              {notification.project}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end justify-between self-stretch py-0.5">
          <time
            className="whitespace-nowrap text-[11px] leading-none text-devflow-text-muted tabular-nums"
            dateTime={notification.time}
          >
            {notification.time}
          </time>
          <span
            className="flex size-5 items-center justify-center text-devflow-text-muted"
            aria-hidden
          >
            <Icon className="size-3.5" strokeWidth={2} />
          </span>
        </div>
      </button>
    </li>
  )
}

function DropdownFooter({ onClose }: { onClose: () => void }) {
  return (
    <footer className="box-border flex h-11 shrink-0 items-center justify-between border-t border-devflow-panel-border bg-devflow-card px-4">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-none text-devflow-icon-muted transition-colors hover:text-devflow-text-secondary"
      >
        <Settings className="size-3.5" strokeWidth={2} />
        Notification preferences
      </button>
      <Link
        to={ROUTES.notifications}
        onClick={onClose}
        className="inline-flex items-center gap-0.5 text-[12px] font-medium leading-none text-devflow-accent transition-colors hover:text-devflow-accent-hover"
      >
        View all notifications
        <ChevronRight className="size-3.5" strokeWidth={2.5} />
      </Link>
    </footer>
  )
}

export function NotificationDropdownPanel({
  onClose,
  maxHeight,
}: NotificationDropdownPanelProps) {
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
      className="flex w-full flex-col overflow-hidden rounded-xl border border-devflow-panel-border-strong bg-devflow-card shadow-devflow-md"
      style={{ maxHeight }}
      role="dialog"
      aria-label="Notifications"
      aria-modal="false"
    >
      <DropdownHeader
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onClose={onClose}
      />

      <DropdownTabs
        activeTab={activeTab}
        unreadCount={unreadCount}
        mentionUnreadCount={mentionUnreadCount}
        onTabChange={setActiveTab}
      />

      <ul
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overscroll-contain',
          LIST_SCROLLBAR,
        )}
      >
        {filtered.length === 0 ? (
          <li className="px-4 py-10 text-center text-[13px] text-devflow-text-muted">
            No notifications here
          </li>
        ) : (
          filtered.map((n) => (
            <DropdownNotificationRow
              key={n.id}
              notification={n}
              onMarkRead={markRead}
            />
          ))
        )}
      </ul>

      <DropdownFooter onClose={onClose} />
    </div>
  )
}
