import { useCallback, useState, type FormEvent } from 'react'
import { inviteProjectMember } from '@/api/members'
import { ApiError } from '@/api/types'
import { useProjectMembersContext } from '@/contexts/ProjectMembersContext'
import { PROJECT_ROLES } from '@/features/members/memberUtils'

export function useProjectMembers(projectId: string) {
  const { members, loading, error, reload } = useProjectMembersContext()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<string>(PROJECT_ROLES[0].value)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const resetInviteState = useCallback(() => {
    setInviteEmail('')
    setInviteRole(PROJECT_ROLES[0].value)
    setInviteError(null)
    setInviteSuccess(null)
  }, [])

  const handleInviteSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
          await reload()
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
    },
    [projectId, inviteEmail, inviteRole, inviting, reload],
  )

  return {
    members,
    loading,
    error,
    reload,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviting,
    inviteError,
    inviteSuccess,
    resetInviteState,
    handleInviteSubmit,
  }
}
