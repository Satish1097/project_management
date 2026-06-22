import { useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { BRANDING } from '@/constants/branding'
import { Avatar } from '@/components/ui/Avatar'
import { InviteMemberForm } from '@/features/members/InviteMemberForm'
import { MemberActionsMenu } from '@/features/members/MemberActionsMenu'
import {
  INVITE_EMAIL_INPUT_ID,
  PROJECT_ROLES,
  avatarColorFromName,
  formatMemberRole,
  getMemberDisplayName,
} from '@/features/members/memberUtils'
import { useProjectMembers } from '@/hooks/useProjectMembers'

export function ProjectSettingsMembersPage() {
  const { projectId = '' } = useParams()
  const {
    members,
    loading,
    error,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviting,
    inviteError,
    inviteSuccess,
    handleInviteSubmit,
    reload,
  } = useProjectMembers(projectId)
  const [roleFilter, setRoleFilter] = useState('all')

  const filteredMembers =
    roleFilter === 'all'
      ? members
      : members.filter((member) => member.role === roleFilter)

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
        <Loader2 className="size-4 animate-spin" />
        Loading members…
      </div>
    )
  }

  if (error) {
    return <p className="text-body text-red-600">{error}</p>
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-page-title text-devflow-text">Members</h1>
          <p className="text-body text-devflow-text-secondary">
            {BRANDING.workspaceAccessCopy}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-devflow-brand-deep px-4 py-1.5 text-btn text-white shadow-devflow-sm"
          onClick={() => {
            document.getElementById(INVITE_EMAIL_INPUT_ID)?.focus()
          }}
        >
          <UserPlus className="size-4" strokeWidth={2} />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-devflow-border bg-devflow-muted px-4 py-3">
            <h3 className="text-section-title text-devflow-text">
              Active Members ({members.length})
            </h3>
            <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
              Filter by:
              <select
                className="rounded border-0 bg-transparent font-semibold text-devflow-brand outline-none"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {PROJECT_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-devflow-border text-left">
                <th className="px-4 py-2 font-mono text-caption font-medium tracking-[0.24px] text-devflow-text-secondary">
                  MEMBER
                </th>
                <th className="px-4 py-2 font-mono text-caption font-medium tracking-[0.24px] text-devflow-text-secondary">
                  ROLE
                </th>
                <th className="px-4 py-2 text-right font-mono text-caption font-medium tracking-[0.24px] text-devflow-text-secondary">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const displayName = getMemberDisplayName(member)
                const email = member.email ?? ''
                const color = avatarColorFromName(displayName)

                return (
                  <tr
                    key={member.user_id}
                    className="border-b border-devflow-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Avatar name={displayName} color={color} size={40} />
                        <div>
                          <p className="font-semibold text-devflow-text">{displayName}</p>
                          {email ? (
                            <p className="text-body text-devflow-text-secondary">{email}</p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-devflow-nav-active px-3 py-1 text-caption font-semibold text-devflow-brand">
                        {formatMemberRole(member.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <MemberActionsMenu
                        member={member}
                        projectId={projectId}
                        onUpdated={reload}
                      />
                    </td>
                  </tr>
                )
              })}
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-body text-devflow-text-secondary"
                  >
                    No members match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <InviteMemberForm
          className="rounded-lg border border-devflow-border bg-devflow-card p-4 shadow-sm"
          inviteEmail={inviteEmail}
          inviteRole={inviteRole}
          inviting={inviting}
          inviteError={inviteError}
          inviteSuccess={inviteSuccess}
          onEmailChange={setInviteEmail}
          onRoleChange={setInviteRole}
          onSubmit={handleInviteSubmit}
        />
      </div>
    </>
  )
}
