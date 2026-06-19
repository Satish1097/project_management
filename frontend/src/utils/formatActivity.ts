export function formatActivityAction(eventType: string): string {
  switch (eventType) {
    case 'status_changed':
      return 'changed status on'
    case 'sprint_changed':
      return 'moved'
    case 'comment_added':
      return 'commented on'
    case 'assignee_changed':
      return 'changed assignee for'
    case 'comment_deleted':
      return 'deleted comment on'
    case 'attachment_added':
      return 'added attachment to'
    case 'attachment_deleted':
      return 'removed attachment from'
    default:
      return eventType.replace(/_/g, ' ')
  }
}

export function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'Just now'

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  }

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
