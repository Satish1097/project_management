import { Avatar } from '@/components/ui/Avatar'
import { UserHoverCard } from '@/components/ui/UserHoverCard'
import { useUserProfile } from '@/hooks/useUserProfile'
import type { UserProfileInput } from '@/types/userProfile'
import { isPlaceholderAssigneeName } from '@/utils/assigneeColors'

export type UserAvatarProps = {
  name: string
  color: string
  size?: number
  className?: string
  userId?: string
  email?: string
  role?: string
  joinedAt?: string
  projectId?: string
  showHoverCard?: boolean
  showTooltip?: boolean
}

export function UserAvatar({
  name,
  color,
  size = 24,
  className,
  userId,
  email,
  role,
  joinedAt,
  projectId,
  showHoverCard = true,
  showTooltip = false,
}: UserAvatarProps) {
  const profile: UserProfileInput = {
    userId,
    name,
    color,
    email,
    role,
    joinedAt,
  }

  const resolved = useUserProfile(userId ? profile : null, projectId)
  const displayName = resolved?.displayName ?? name
  const displayColor = resolved?.color ?? color
  const isUnassigned =
    displayName === 'Unassigned' ||
    name === 'Unassigned' ||
    (!userId && isPlaceholderAssigneeName(name))

  const avatar = (
    <Avatar
      name={displayName}
      color={displayColor}
      size={size}
      className={className}
      showTooltip={showTooltip}
    />
  )

  if (!showHoverCard || isUnassigned) {
    return avatar
  }

  return (
    <UserHoverCard profile={profile} projectId={projectId}>
      {avatar}
    </UserHoverCard>
  )
}
