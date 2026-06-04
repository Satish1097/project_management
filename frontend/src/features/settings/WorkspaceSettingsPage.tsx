import { UserPlus, MoreHorizontal } from 'lucide-react'
import { BRANDING } from '@/constants/branding'
import { MyTasksHeader } from '@/components/layout/MyTasksHeader'
import { ProjectSettingsTabs } from '@/components/layout/ProjectSettingsTabs'
import { Avatar } from '@/components/ui/Avatar'
import { mockMembers } from '@/services/mockMembers'

export function WorkspaceSettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-devflow-surface">
      <MyTasksHeader />
      <main className="flex-1 p-4">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-page-title tracking-[-0.64px] text-devflow-text">
              Project Settings
            </h1>
            <p className="text-body text-devflow-text-secondary">
              Manage your project preferences, labels, and workflow integrations.
            </p>
          </div>
        </div>
        <ProjectSettingsTabs />
        <div className="mt-6 flex items-end justify-between">
          <div>
            <h2 className="text-section-title text-devflow-text">
              Workspace Members
            </h2>
            <p className="text-body text-devflow-text-secondary">
              {BRANDING.workspaceAccessCopy}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-devflow-brand-deep px-4 py-1.5 text-btn text-white shadow-devflow-sm"
          >
            <UserPlus className="size-4" strokeWidth={2} />
            Invite Member
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-sm lg:col-span-3">
            <div className="flex items-center justify-between border-b border-devflow-border bg-devflow-muted px-4 py-3">
              <h3 className="text-section-title text-devflow-text">
                Active Members (12)
              </h3>
              <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
                Filter by:
                <select className="rounded border-0 bg-transparent font-semibold text-devflow-brand outline-none">
                  <option>All Roles</option>
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
                {mockMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-devflow-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <Avatar name={member.name} color={member.color} size={40} />
                        <div>
                          <p className="font-semibold text-devflow-text">
                            {member.name}
                          </p>
                          <p className="text-body text-devflow-text-secondary">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-devflow-nav-active px-3 py-1 text-caption font-semibold text-devflow-brand">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button type="button" className="text-devflow-text-secondary">
                        <MoreHorizontal className="size-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-devflow-border bg-devflow-card p-4 shadow-sm">
            <h3 className="text-section-title text-devflow-text">Invite Members</h3>
            <p className="mt-2 text-body text-devflow-text-secondary">
              Send invitations via email to join your workspace.
            </p>
            <input
              type="email"
              placeholder="colleague@company.com"
              className="mt-4 w-full rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-input outline-none"
            />
            <button
              type="button"
              className="mt-4 w-full rounded-lg bg-devflow-brand-deep py-2 text-btn text-white"
            >
              Send Invite
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
