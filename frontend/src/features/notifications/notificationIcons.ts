import { Bell, MessageSquare, UserPlus } from 'lucide-react'
import type { NotificationType } from './types'

export const notificationIconMap = {
  mention: MessageSquare,
  assign: UserPlus,
  comment: MessageSquare,
  invite: Bell,
} satisfies Record<NotificationType, typeof Bell>
