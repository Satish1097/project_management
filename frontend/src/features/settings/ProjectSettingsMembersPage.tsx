import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, MoreHorizontal, UserPlus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getProjectMembers, inviteProjectMember } from '@/api/members'
import { ApiError } from '@/api/types'
import { BRANDING } from '@/constants/branding'
import { Avatar } from '@/components/ui/Avatar'

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#3b82f6', '#8b5cf6', '#94a3b8']

const PROJECT_ROLES = [
  { value: 'developer', label: 'Developer' },
  { value: 'qa', label: 'QA' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'project_admin', label: 'Project Admin' },
] as const

function avatarColorFromName(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] ?? '#94a3b8'
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ProjectSettingsMembersPage() {
  const { projectId = '' } = useParams()
  const [members, setMembers] = useState<Awaited<ReturnType<typeof getProjectMembers>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>(PROJECT_ROLES[0].value)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMembers() {
      if (!projectId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getProjectMembers(projectId)
        if (!cancelled) setMembers(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load members.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadMembers()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const filteredMembers =
    roleFilter === 'all'
      ? members
      : members.filter((member) => member.role === roleFilter)

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!projectId || !inviteEmail.trim() || inviting) return

    setInviting(true)
    setInviteError(null)
    setInviteSuccess(null)

    try {
      const result = await inviteProjectMember(projectId, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      })

      if (result.status === 'added_existing_user') {
        setInviteSuccess('Member added successfully.')
        const data = await getProjectMembers(projectId)
        setMembers(data)
      } else {
        setInviteSuccess('Invitation sent.')
      }

      setInviteEmail('')
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : 'Failed to send invitation.',
      )
    } finally {
      setInviting(false)
    }
  }

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
            document.getElementById('invite-email')?.focus()
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
                const displayName = member.display_name || member.email || 'Member'
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
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button type="button" className="text-devflow-text-secondary">
                        <MoreHorizontal className="size-5" />
                      </button>
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
        <form
          className="rounded-lg border border-devflow-border bg-devflow-card p-4 shadow-sm"
          onSubmit={handleInviteSubmit}
        >
          <h3 className="text-section-title text-devflow-text">Invite Members</h3>
          <p className="mt-2 text-body text-devflow-text-secondary">
            Send invitations via email to join your workspace.
          </p>
          <input
            id="invite-email"
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="mt-4 w-full rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-input outline-none"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="mt-3 w-full rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-input outline-none"
          >
            {PROJECT_ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          {inviteError ? (
            <p className="mt-3 text-caption text-red-600">{inviteError}</p>
          ) : null}
          {inviteSuccess ? (
            <p className="mt-3 text-caption text-devflow-brand">{inviteSuccess}</p>
          ) : null}
          <button
            type="submit"
            disabled={inviting || !inviteEmail.trim()}
            className="mt-4 w-full rounded-lg bg-devflow-brand-deep py-2 text-btn text-white disabled:opacity-60"
          >
            {inviting ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </>
  )
}
