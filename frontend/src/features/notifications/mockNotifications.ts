import { BRANDING } from '@/constants/branding'
import type { Notification } from './types'

export const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'mention',
    title: 'Mentioned in DF-101',
    eventType: 'comment_added',
    color: '#8b5cf6',
    message: 'Please review the latest designs.',
    createdAt: new Date().toISOString(),
    unread: true,
  },
  {
    id: '2',
    type: 'assign',
    title: 'Assigned to DF-1085',
    eventType: 'issue_assigned',
    color: '#3b82f6',
    message: 'Update the API documentation for the new endpoints.',
    createdAt: new Date().toISOString(),
    unread: true,
  },
  {
    id: '3',
    type: 'comment',
    title: 'Comment added on DF-1102',
    eventType: 'comment_added',
    color: '#10b981',
    message: 'Looks good to me, ship it.',
    createdAt: new Date().toISOString(),
    unread: false,
  },
  {
    id: '4',
    type: 'system',
    title: 'Sprint reminder',
    eventType: 'system',
    color: '#94a3b8',
    message: `${BRANDING.projectCoreName}: Sprint 42 starts tomorrow`,
    createdAt: new Date().toISOString(),
    unread: false,
  },
]
