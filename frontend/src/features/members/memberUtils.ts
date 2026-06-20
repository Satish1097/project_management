export const INVITE_EMAIL_INPUT_ID = 'invite-email'

export const PROJECT_ROLES = [
  { value: 'developer', label: 'Developer' },
  { value: 'qa', label: 'QA' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'project_admin', label: 'Project Admin' },
] as const

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6', '#94a3b8']

export function avatarColorFromName(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] ?? '#94a3b8'
}

export function formatMemberRole(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getMemberDisplayName(member: {
  display_name?: string
  email?: string
}): string {
  return member.display_name || member.email || 'Member'
}

export function projectMembersToAvatarGroup(
  members: Array<{ display_name?: string; email?: string }>,
  maxVisible = 3,
) {
  const visible = members.slice(0, maxVisible)
  const avatarMembers = visible.map((member) => {
    const name = getMemberDisplayName(member)
    return { name, color: avatarColorFromName(name) }
  })
  const extra =
    members.length > maxVisible ? members.length - maxVisible : undefined

  return { members: avatarMembers, extra }
}
