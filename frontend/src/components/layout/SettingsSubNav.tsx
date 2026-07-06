import { Columns3, GitBranch, Plug, Settings, Tags, Users } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  projectSettingsBoardPath,
  projectSettingsGeneralPath,
  projectSettingsIntegrationsPath,
  projectSettingsLabelsPath,
  projectSettingsMembersPath,
  projectSettingsStatusesPath,
} from '@/constants/routes'
import { useProjectMethodology } from '@/hooks/useProjectMethodology'
import { cn } from '@/utils/cn'

export function SettingsSubNav() {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()
  const { isKanban } = useProjectMethodology(projectId)

  const items = [
    { label: 'General', icon: Settings, path: projectSettingsGeneralPath(projectId) },
    { label: 'Members', icon: Users, path: projectSettingsMembersPath(projectId) },
    { label: 'Statuses', icon: GitBranch, path: projectSettingsStatusesPath(projectId) },
    ...(isKanban
      ? [{ label: 'Board', icon: Columns3, path: projectSettingsBoardPath(projectId) }]
      : []),
    { label: 'Labels', icon: Tags, path: projectSettingsLabelsPath(projectId) },
    {
      label: 'Integrations',
      icon: Plug,
      path: projectSettingsIntegrationsPath(projectId),
    },
  ] as const

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-devflow-border bg-devflow-surface px-3 py-3">
      <div className="pb-6">
        <h2 className="px-4 text-section-title text-devflow-text">Settings</h2>
        <p className="px-4 text-body text-devflow-text-secondary">
          Manage this project
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ label, icon: Icon, path }) => (
          <Link
            key={label}
            to={path}
            className={cn(
              'flex items-center gap-4 rounded-lg px-4 py-2 text-nav',
              pathname === path
                ? 'bg-[var(--df-settings-active)] font-semibold text-devflow-primary'
                : 'text-devflow-text-secondary',
            )}
          >
            <Icon className="size-[22px] shrink-0" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
