import type { ProjectMemberRecord } from '@/api/members'
import type { AuthUser } from '@/features/auth/types'
import { avatarColorFromName, getMemberDisplayName } from '@/features/members/memberUtils'
import type { UserProfileInfo, UserProfileInput } from '@/types/userProfile'
import { isPlaceholderAssigneeName } from '@/utils/assigneeColors'

type ResolveUserProfileOptions = {
  input: UserProfileInput
  projectId?: string
  authUser?: AuthUser | null
  findMember?: (userId: string, projectId?: string) => ProjectMemberRecord | undefined
}

export function resolveUserProfile({
  input,
  projectId,
  authUser,
  findMember,
}: ResolveUserProfileOptions): UserProfileInfo {
  const { userId, name, color, email, role, joinedAt } = input

  if (userId && authUser?.id === userId) {
    return {
      userId,
      displayName: authUser.display_name || authUser.email,
      name: authUser.display_name || authUser.email,
      color: avatarColorFromName(authUser.display_name || authUser.email),
      email: authUser.email,
      avatarUrl: authUser.avatar,
      timezone: authUser.timezone,
      role,
      joinedAt,
    }
  }

  const member = userId && findMember ? findMember(userId, projectId) : undefined

  if (member) {
    const displayName = getMemberDisplayName(member)
    return {
      userId: member.user_id,
      displayName,
      name: displayName,
      color: avatarColorFromName(displayName),
      email: member.email ?? email,
      role: member.role ?? role,
      joinedAt: member.joined_at ?? joinedAt,
    }
  }

  return {
    userId,
    displayName: isPlaceholderAssigneeName(name) ? 'Member' : name,
    name: isPlaceholderAssigneeName(name) ? 'Member' : name,
    color,
    email,
    role,
    joinedAt,
  }
}
