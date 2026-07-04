import { Mail, Shield } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { formatMemberRole } from '@/features/members/memberUtils'
import type { UserProfileInfo } from '@/types/userProfile'
import { cn } from '@/utils/cn'

type UserProfileCardContentProps = {
  profile: UserProfileInfo
  className?: string
}

function formatJoinedDate(joinedAt?: string): string | null {
  if (!joinedAt) return null
  const date = new Date(joinedAt)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function UserProfileCardContent({
  profile,
  className,
}: UserProfileCardContentProps) {
  const joinedLabel = formatJoinedDate(profile.joinedAt)
  const roleLabel = profile.role ? formatMemberRole(profile.role) : null

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-devflow-border bg-devflow-card shadow-devflow-md',
        className,
      )}
    >
      <div
        className="h-14"
        style={{ backgroundColor: profile.color }}
        aria-hidden
      />

      <div className="relative px-4 pb-4">
        <div className="-mt-7 mb-3">
          <Avatar
            name={profile.displayName}
            color={profile.color}
            size={56}
            showTooltip={false}
            className="border-[3px] border-devflow-card shadow-devflow-sm"
          />
        </div>

        <h3 className="truncate text-[15px] font-semibold leading-tight text-devflow-text">
          {profile.displayName}
        </h3>

        {profile.email ? (
          <div className="mt-1.5 flex items-center gap-1.5 text-caption text-devflow-text-secondary">
            <Mail className="size-3.5 shrink-0 text-devflow-text-muted" strokeWidth={2} />
            <span className="truncate">{profile.email}</span>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {roleLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-devflow-nav-active px-2.5 py-0.5 text-[11px] font-semibold text-devflow-brand">
              <Shield className="size-3" strokeWidth={2.25} />
              {roleLabel}
            </span>
          ) : null}

          {profile.timezone ? (
            <span className="rounded-full bg-devflow-muted px-2.5 py-0.5 text-[11px] font-medium text-devflow-text-secondary">
              {profile.timezone}
            </span>
          ) : null}
        </div>

        {joinedLabel ? (
          <p className="mt-3 border-t border-devflow-border pt-3 text-[11px] text-devflow-text-muted">
            Member since {joinedLabel}
          </p>
        ) : null}
      </div>
    </div>
  )
}
