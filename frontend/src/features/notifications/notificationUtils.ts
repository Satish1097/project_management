import type { Notification, NotificationTab } from './types'

export const NOTIFICATION_TABS: { id: NotificationTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'mentions', label: 'Mentions' },
]

export function filterNotifications(
  items: Notification[],
  tab: NotificationTab,
): Notification[] {
  if (tab === 'unread') return items.filter((n) => n.unread)
  if (tab === 'mentions') return items.filter((n) => n.type === 'mention')
  return items
}

export function getTabBadgeCount(
  tab: NotificationTab,
  unreadCount: number,
  mentionUnreadCount: number,
): number | null {
  if (tab === 'all' && unreadCount > 0) return unreadCount
  if (tab === 'unread' && unreadCount > 0) return unreadCount
  if (tab === 'mentions' && mentionUnreadCount > 0) return mentionUnreadCount
  return null
}

export function formatNotificationCreatedAt(createdAt: string): string {
  const parsed = new Date(createdAt)
  if (Number.isNaN(parsed.getTime())) return createdAt

  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
