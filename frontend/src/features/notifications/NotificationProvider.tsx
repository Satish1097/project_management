import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { initialNotifications } from './mockNotifications'
import type { Notification, NotificationTab } from './types'

type NotificationContextValue = {
  notifications: Notification[]
  isOpen: boolean
  activeTab: NotificationTab
  unreadCount: number
  mentionUnreadCount: number
  open: () => void
  close: () => void
  toggle: () => void
  setActiveTab: (tab: NotificationTab) => void
  markAllRead: () => void
  markRead: (id: string) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  )

  const mentionUnreadCount = useMemo(
    () =>
      notifications.filter((n) => n.unread && n.type === 'mention').length,
    [notifications],
  )

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    )
  }, [])

  const value = useMemo(
    () => ({
      notifications,
      isOpen,
      activeTab,
      unreadCount,
      mentionUnreadCount,
      open,
      close,
      toggle,
      setActiveTab,
      markAllRead,
      markRead,
    }),
    [
      notifications,
      isOpen,
      activeTab,
      unreadCount,
      mentionUnreadCount,
      open,
      close,
      toggle,
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
