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
  'scroll-smooth [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.45)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d1d5db] hover:[&::-webkit-scrollbar-thumb]:bg-[#9ca3af]'

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
    <header className="box-border flex h-[52px] shrink-0 items-center justify-between border-b border-[#e8eaef] bg-white px-5">
      <h2 className="text-[15px] font-semibold leading-none tracking-[-0.01em] text-[#111827]">
        Notifications
      </h2>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          className="text-[13px] font-medium leading-none text-[#2563eb] transition-colors hover:text-[#1d4ed8] disabled:pointer-events-none disabled:opacity-40"
        >
          Mark all read
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#f3f4f6] hover:text-[#6b7280]"
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
      className="box-border flex h-11 shrink-0 items-stretch gap-1 border-b border-[#e8eaef] bg-white px-4"
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
                ? 'text-[#2563eb]'
                : 'text-[#9ca3af] hover:text-[#6b7280]',
            )}
          >
            {tab.label}
            {badge != null && (
              <span
                className={cn(
                  'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none tabular-nums',
                  isActive
                    ? 'bg-[#2563eb] text-white'
                    : 'bg-[#f3f4f6] text-[#6b7280]',
                )}
              >
                {badge > 9 ? '9+' : badge}
              </span>
            )}
            {isActive && (
              <span
                className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-[#2563eb]"
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
          'box-border grid w-full grid-cols-[12px_40px_minmax(0,1fr)_56px] items-start gap-x-3 gap-y-0 border-b border-[#f0f1f3] px-4 py-3.5 text-left transition-colors duration-150',
          'hover:bg-[#f9fafb] focus-visible:bg-[#f9fafb] focus-visible:outline-none',
          notification.unread && 'bg-[#fafbfc]',
        )}
      >
        <div className="flex justify-center pt-1.5">
          {notification.unread ? (
            <span
              className="size-2 shrink-0 rounded-full bg-[#2563eb]"
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
          <p className="text-[13px] leading-[1.35] text-[#374151]">
            <span className="font-semibold text-[#111827]">
              {notification.user}
            </span>{' '}
            <span className="font-normal">{notification.message}</span>
          </p>
          {notification.preview && (
            <p className="mt-0.5 truncate text-[13px] leading-[1.35] text-[#6b7280]">
              {notification.preview}
            </p>
          )}
          {notification.project && (
            <p className="mt-1 truncate text-[11px] leading-none text-[#9ca3af]">
              {notification.project}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end justify-between self-stretch py-0.5">
          <time
            className="whitespace-nowrap text-[11px] leading-none text-[#9ca3af] tabular-nums"
            dateTime={notification.time}
          >
            {notification.time}
          </time>
          <span
            className="flex size-5 items-center justify-center text-[#c4c9d2]"
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
    <footer className="box-border flex h-11 shrink-0 items-center justify-between border-t border-[#e8eaef] bg-white px-4">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium leading-none text-[#6b7280] transition-colors hover:text-[#374151]"
      >
        <Settings className="size-3.5" strokeWidth={2} />
        Notification preferences
      </button>
      <Link
        to={ROUTES.notifications}
        onClick={onClose}
        className="inline-flex items-center gap-0.5 text-[12px] font-medium leading-none text-[#2563eb] transition-colors hover:text-[#1d4ed8]"
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
      className="flex w-full flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
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
          <li className="px-4 py-10 text-center text-[13px] text-[#9ca3af]">
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
