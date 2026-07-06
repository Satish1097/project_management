import { DrawerPanel } from '@/components/ui/DrawerPanel'
import { InviteMemberForm } from '@/features/members/InviteMemberForm'
import type { useProjectMembers } from '@/hooks/useProjectMembers'

type InviteMemberDrawerProps = {
  open: boolean
  onClose: () => void
  invite: Pick<
    ReturnType<typeof useProjectMembers>,
    | 'inviteEmail'
    | 'setInviteEmail'
    | 'inviteRole'
    | 'setInviteRole'
    | 'inviting'
    | 'inviteError'
    | 'inviteSuccess'
    | 'handleInviteSubmit'
  >
}

export function InviteMemberDrawer({ open, onClose, invite }: InviteMemberDrawerProps) {
  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Invite Member"
      subtitle="Send an invitation to join this project."
    >
      <InviteMemberForm
        showHeader={false}
        inviteEmail={invite.inviteEmail}
        inviteRole={invite.inviteRole}
        inviting={invite.inviting}
        inviteError={invite.inviteError}
        inviteSuccess={invite.inviteSuccess}
        onEmailChange={invite.setInviteEmail}
        onRoleChange={invite.setInviteRole}
        onSubmit={invite.handleInviteSubmit}
      />
    </DrawerPanel>
  )
}
