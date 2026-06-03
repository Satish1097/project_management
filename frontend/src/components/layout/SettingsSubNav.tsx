import { GitBranch, Settings, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const items = [
  { label: 'General', icon: Settings, path: ROUTES.projectSettings },
  { label: 'Members', icon: Users, path: ROUTES.workspaceSettings },
  { label: 'Statuses', icon: GitBranch, path: '#' },
] as const

export function SettingsSubNav() {
  const { pathname } = useLocation()

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-devflow-border bg-devflow-surface px-3 py-3">
      <div className="pb-6">
        <h2 className="px-4 text-section-title text-devflow-text">Settings</h2>
        <p className="px-4 text-body text-devflow-text-secondary">
          Manage your workspace
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
                ? 'bg-[rgba(0,88,190,0.05)] font-semibold text-devflow-primary'
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
