import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Loader2, Settings2, UserPlus } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { InviteMemberDrawer } from '@/features/members/InviteMemberDrawer'
import {
  avatarColorFromName,
  formatMemberRole,
  getMemberDisplayName,
} from '@/features/members/memberUtils'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { getProjectById } from '@/services/projectData'
import { projectSettingsMembersPath } from '@/constants/routes'

export function ProjectTeamPage() {
  const { projectId = '' } = useParams()
  const project = getProjectById(projectId)
  const membersState = useProjectMembers(projectId)
  const { members, loading, error } = membersState
  const [inviteOpen, setInviteOpen] = useState(false)

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  if (loading) {
    return (
      <main className="page-main p-4">
        <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
          <Loader2 className="size-4 animate-spin" />
          Loading team…
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-main p-4">
        <p className="text-body text-red-600">{error}</p>
      </main>
    )
  }

  return (
    <main className="page-main p-4">
      <div className="page-stack min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-page-title text-devflow-text">Team</h2>
            <p className="mt-0.5 text-body text-devflow-text-secondary">
              {members.length} {members.length === 1 ? 'member' : 'members'} on this project
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={projectSettingsMembersPath(projectId)}
              className="inline-flex items-center gap-2 rounded-lg border border-devflow-border bg-devflow-card px-4 py-1.5 text-btn text-devflow-text shadow-sm transition-colors hover:bg-devflow-surface"
            >
              <Settings2 className="size-4" strokeWidth={2} />
              Manage Permissions
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-devflow-brand-deep px-4 py-1.5 text-btn text-white shadow-devflow-sm"
              onClick={() => setInviteOpen(true)}
            >
              <UserPlus className="size-4" strokeWidth={2} />
              Invite Member
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-sm">
          <div className="border-b border-devflow-border bg-devflow-muted px-4 py-3">
            <h3 className="text-section-title text-devflow-text">Project Members</h3>
          </div>
          {members.length === 0 ? (
            <p className="px-4 py-8 text-center text-body text-devflow-text-secondary">
              No members yet. Invite someone to get started.
            </p>
          ) : (
            <ul className="divide-y divide-devflow-border">
              {members.map((member) => {
                const displayName = getMemberDisplayName(member)
                const email = member.email ?? ''
                const color = avatarColorFromName(displayName)

                return (
                  <li
                    key={member.user_id}
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <UserAvatar
                        name={displayName}
                        color={color}
                        size={40}
                        userId={member.user_id}
                        email={member.email}
                        role={member.role}
                        joinedAt={member.joined_at}
                        projectId={projectId}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-devflow-text">{displayName}</p>
                        {email ? (
                          <p className="truncate text-body text-devflow-text-secondary">
                            {email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <span className="rounded-full bg-devflow-nav-active px-3 py-1 text-caption font-semibold text-devflow-brand">
                      {formatMemberRole(member.role)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <InviteMemberDrawer
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        invite={membersState}
      />
    </main>
  )
}
