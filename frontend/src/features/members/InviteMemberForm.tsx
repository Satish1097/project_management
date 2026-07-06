import type { FormEvent } from 'react'
import { INVITE_EMAIL_INPUT_ID, PROJECT_ROLES } from '@/features/members/memberUtils'

type InviteMemberFormProps = {
  inviteEmail: string
  inviteRole: string
  inviting: boolean
  inviteError: string | null
  inviteSuccess: string | null
  onEmailChange: (email: string) => void
  onRoleChange: (role: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  className?: string
  showHeader?: boolean
}

export function InviteMemberForm({
  inviteEmail,
  inviteRole,
  inviting,
  inviteError,
  inviteSuccess,
  onEmailChange,
  onRoleChange,
  onSubmit,
  className,
  showHeader = true,
}: InviteMemberFormProps) {
  return (
    <form className={className} onSubmit={onSubmit}>
      {showHeader ? (
        <>
          <h3 className="text-section-title text-devflow-text">Invite Members</h3>
          <p className="mt-2 text-body text-devflow-text-secondary">
            Send invitations via email to join your workspace.
          </p>
        </>
      ) : null}
      <input
        id={INVITE_EMAIL_INPUT_ID}
        type="email"
        required
        value={inviteEmail}
        onChange={(e) => onEmailChange(e.target.value)}
        placeholder="colleague@company.com"
        className="mt-4 w-full rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-input outline-none"
      />
      <select
        value={inviteRole}
        onChange={(e) => onRoleChange(e.target.value)}
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
  )
}
