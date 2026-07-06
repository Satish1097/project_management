const MEMBER_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
]

export const UNASSIGNED_ASSIGNEE = { name: 'Unassigned', color: '#94a3b8' } as const

/** UI placeholder labels — not real user display names */
const PLACEHOLDER_ASSIGNEE_NAMES = new Set([
  'Assigned',
  'Unassigned',
  'Member',
  'Reporter',
  'Creator',
])

export function isPlaceholderAssigneeName(name: string): boolean {
  return PLACEHOLDER_ASSIGNEE_NAMES.has(name)
}

export function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length]
}
