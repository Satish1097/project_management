export type NotificationType =
  | 'mention'
  | 'assign'
  | 'comment'
  | 'status'
  | 'attachment'
  | 'system'

export type NotificationTab = 'all' | 'unread' | 'mentions'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  eventType: string
  color: string
  message: string
  createdAt: string
  unread: boolean
}
