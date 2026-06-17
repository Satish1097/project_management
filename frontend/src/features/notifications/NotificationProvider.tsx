import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationApi,
} from '@/api/notifications'
import { ApiError } from '@/api/types'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Notification, NotificationTab } from './types'

type NotificationContextValue = {
  notifications: Notification[]
  isOpen: boolean
  activeTab: NotificationTab
  isLoading: boolean
  error: string | null
  unreadCount: number
  mentionUnreadCount: number
  open: () => void
  close: () => void
  toggle: () => void
  setActiveTab: (tab: NotificationTab) => void
  reload: () => Promise<void>
  markAllRead: () => Promise<void>
  markRead: (id: string) => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
)

function toNotificationType(
  eventType: NotificationApi['event_type'],
): Notification['type'] {
  if (eventType === 'issue_assigned' || eventType === 'assignee_changed' || eventType === 'sprint_assigned') {
    return 'assign'
  }
  if (eventType === 'comment_added') return 'mention'
  if (eventType === 'status_changed') return 'status'
  if (eventType === 'attachment_added') return 'attachment'
  return 'system'
}

function colorForType(type: Notification['type']): string {
  if (type === 'assign') return '#3b82f6'
  if (type === 'mention') return '#8b5cf6'
  if (type === 'comment') return '#10b981'
  if (type === 'status') return '#f59e0b'
  if (type === 'attachment') return '#14b8a6'
  return '#94a3b8'
}

function mapApiNotification(notification: NotificationApi): Notification {
  const type = toNotificationType(notification.event_type)

  return {
    id: notification.id,
    type,
    title: notification.title,
    eventType: notification.event_type,
    color: colorForType(type),
    message: notification.message,
    createdAt: notification.created_at,
    unread: !notification.is_read,
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([])
      setUnreadCount(0)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [items, unread] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ])
      setNotifications(items.map(mapApiNotification))
      setUnreadCount(unread)
    } catch (loadError) {
      const message =
        loadError instanceof ApiError
          ? loadError.message
          : 'Failed to load notifications.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthLoading) return
    void loadNotifications()
  }, [isAuthLoading, loadNotifications])

  const mentionUnreadCount = useMemo(
    () =>
      notifications.filter((n) => n.unread && n.type === 'mention').length,
    [notifications],
  )

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return

    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
      setUnreadCount(0)
      setError(null)
    } catch (markAllError) {
      const message =
        markAllError instanceof ApiError
          ? markAllError.message
          : 'Failed to mark all notifications as read.'
      setError(message)
    }
  }, [unreadCount])

  const markRead = useCallback(async (id: string) => {
    const target = notifications.find((notification) => notification.id === id)
    if (!target || !target.unread) return

    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setError(null)
    } catch (markError) {
      const message =
        markError instanceof ApiError
          ? markError.message
          : 'Failed to mark notification as read.'
      setError(message)
    }
  }, [notifications])

  const value = useMemo(
    () => ({
      notifications,
      isOpen,
      activeTab,
      isLoading,
      error,
      unreadCount,
      mentionUnreadCount,
      open,
      close,
      toggle,
      setActiveTab,
      reload: loadNotifications,
      markAllRead,
      markRead,
    }),
    [
      notifications,
      isOpen,
      activeTab,
      isLoading,
      error,
      unreadCount,
      mentionUnreadCount,
      open,
      close,
      toggle,
      loadNotifications,
      markAllRead,
      markRead,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return ctx
}
