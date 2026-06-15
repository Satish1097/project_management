export type NotificationType = 'mention' | 'assign' | 'comment' | 'invite'

export type NotificationTab = 'all' | 'unread' | 'mentions'

export type Notification = {
  id: string
  type: NotificationType
  user: string
  color: string
  /** Action line after the sender name, e.g. "mentioned you in DF-101" */
  message: string
  /** Optional body preview shown on the second line */
  preview?: string
  project?: string
  time: string
  unread: boolean
}
