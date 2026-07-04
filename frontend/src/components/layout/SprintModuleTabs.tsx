import { Link } from 'react-router-dom'
import type { SprintModuleTab } from '@/constants/routes'
import { cn } from '@/utils/cn'

type SprintModuleTabsProps = {
  activeTab: SprintModuleTab
  overviewPath: string
  boardPath: string
  listPath: string
  activityPath: string
  trailing?: React.ReactNode
}

const tabs: { id: SprintModuleTab; label: string }[] = [
  { id: 'Overview', label: 'Overview' },
  { id: 'Board', label: 'Board' },
  { id: 'List', label: 'List' },
  { id: 'Activity', label: 'Activity' },
]

export function SprintModuleTabs({
  activeTab,
  overviewPath,
  boardPath,
  listPath,
  activityPath,
  trailing,
}: SprintModuleTabsProps) {
  const paths: Record<SprintModuleTab, string> = {
    Overview: overviewPath,
    Board: boardPath,
    List: listPath,
    Activity: activityPath,
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-devflow-border bg-devflow-card px-4">
      <nav
        className="-mb-px flex items-center gap-0.5 overflow-x-auto"
        aria-label="Sprint views"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={paths[tab.id]}
            className={cn(
              'relative whitespace-nowrap px-3 py-2 text-nav transition-colors',
              tab.id === activeTab
                ? 'font-medium text-devflow-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-devflow-primary'
                : 'text-devflow-text-secondary hover:text-devflow-text',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {trailing ? (
        <div className="flex shrink-0 items-center py-1.5">{trailing}</div>
      ) : null}
    </div>
  )
}
