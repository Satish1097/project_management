import { Bell, MessageSquare, Paperclip, RefreshCw, UserPlus } from 'lucide-react'
import type { NotificationType } from './types'

export const notificationIconMap = {
  mention: MessageSquare,
  assign: UserPlus,
  comment: MessageSquare,
  status: RefreshCw,
  attachment: Paperclip,
  system: Bell,
} satisfies Record<NotificationType, typeof Bell>
