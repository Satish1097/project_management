import { BRANDING } from '@/constants/branding'
import type { Notification } from './types'

export const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    user: 'Sarah Chen',
    color: '#8b5cf6',
    message: 'mentioned you in DF-101',
    preview: 'Please review the latest designs.',
    project: BRANDING.projectCoreName,
    time: '2m ago',
    unread: true,
  },
  {
    id: '2',
    type: 'assign',
    user: 'Alex Rivera',
    color: '#3b82f6',
    message: 'assigned you to DF-1085',
    preview: 'Update the API documentation for the new endpoints.',
    project: 'Sprint 42',
    time: '1h ago',
    unread: true,
  },
  {
    id: '3',
    type: 'comment',
    user: 'Marcus Johnson',
    color: '#10b981',
    message: 'commented on DF-1102',
    preview: 'Looks good to me, ship it.',
    project: BRANDING.projectCoreName,
    time: '3h ago',
    unread: false,
  },
  {
    id: '4',
    type: 'invite',
    user: 'System',
    color: '#94a3b8',
    message: 'Sprint 42 starts tomorrow',
    project: 'Workspace',
    time: 'Yesterday',
    unread: false,
  },
]
