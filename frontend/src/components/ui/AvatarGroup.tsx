import { UserAvatar } from '@/components/ui/UserAvatar'
import { UserHoverCard } from '@/components/ui/UserHoverCard'
import type { ProjectMember } from '@/types/projects'
import { cn } from '@/utils/cn'

type AvatarGroupProps = {
  members: ProjectMember[]
  extra?: number
  size?: number
  projectId?: string
}

export function AvatarGroup({ members, extra, size = 28, projectId }: AvatarGroupProps) {
  return (
    <div className="flex items-center">
      {members.map((member, index) => (
        <div
          key={member.userId ?? member.name}
          className={cn(
            'rounded-full border-2 border-devflow-card',
            index > 0 && '-ml-2',
          )}
        >
          {member.initials ? (
            <MemberInitialsAvatar member={member} projectId={projectId} size={size} />
          ) : (
            <UserAvatar
              name={member.name}
              color={member.color}
              size={size}
              userId={member.userId}
              email={member.email}
              role={member.role}
              joinedAt={member.joinedAt}
              projectId={projectId}
            />
          )}
        </div>
      ))}
      {extra !== undefined && extra > 0 && (
        <div
          className="-ml-2 flex items-center justify-center rounded-full border-2 border-devflow-card bg-[var(--df-avatar-overflow-bg)] text-caption font-bold text-[var(--df-avatar-overflow-text)]"
          style={{ width: size, height: size }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

function MemberInitialsAvatar({
  member,
  projectId,
  size,
}: {
  member: ProjectMember
  projectId?: string
  size: number
}) {
  const content = (
    <div
      className="flex items-center justify-center rounded-full bg-devflow-avatar-bg font-mono text-caption text-devflow-text-muted"
      style={{ width: size, height: size }}
    >
      {member.initials}
    </div>
  )

  return (
    <UserHoverCard
      profile={{
        userId: member.userId,
        name: member.name,
        color: member.color,
        email: member.email,
        role: member.role,
        joinedAt: member.joinedAt,
      }}
      projectId={projectId}
    >
      {content}
    </UserHoverCard>
  )
}
