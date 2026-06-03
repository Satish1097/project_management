import { Avatar } from '@/components/ui/Avatar'
import type { ProjectMember } from '@/types/projects'
import { cn } from '@/utils/cn'

type AvatarGroupProps = {
  members: ProjectMember[]
  extra?: number
  size?: number
}

export function AvatarGroup({ members, extra, size = 28 }: AvatarGroupProps) {
  return (
    <div className="flex items-center">
      {members.map((member, index) => (
        <div
          key={member.name}
          className={cn(
            'rounded-full border-2 border-white',
            index > 0 && '-ml-2',
          )}
        >
          {member.initials ? (
            <div
              className="flex items-center justify-center rounded-full bg-[#f1f5f9] font-mono text-caption text-devflow-text-muted"
              style={{ width: size, height: size }}
            >
              {member.initials}
            </div>
          ) : (
            <Avatar name={member.name} color={member.color} size={size} />
          )}
        </div>
      ))}
      {extra !== undefined && extra > 0 && (
        <div
          className="-ml-2 flex items-center justify-center rounded-full border-2 border-white bg-[#d8e2ff] text-caption font-bold text-[#001a42]"
          style={{ width: size, height: size }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}
