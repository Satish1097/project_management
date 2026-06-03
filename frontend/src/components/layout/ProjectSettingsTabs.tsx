import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const tabs = [
  { label: 'General', path: ROUTES.projectSettings },
  { label: 'Members', path: ROUTES.workspaceSettings },
  { label: 'Labels', path: ROUTES.projectSettingsLabels },
  { label: 'Automations', path: '#' },
  { label: 'Integrations', path: '#' },
] as const

export function ProjectSettingsTabs() {
  const { pathname } = useLocation()

  return (
    <div className="flex border-b border-devflow-border">
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          to={tab.path}
          className={cn(
            'px-4 py-3 text-nav',
            pathname === tab.path
              ? 'border-b-2 border-[#004191] font-bold text-[#004191]'
              : 'font-medium text-devflow-text-secondary',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
