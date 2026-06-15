import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

const tabs = ['Board', 'List', 'Activity'] as const

export type SprintViewTab = (typeof tabs)[number]

type SprintViewTabsProps = {
  activeTab: SprintViewTab
  boardPath: string
  listPath: string
  activityPath: string
  trailing?: React.ReactNode
}

export function SprintViewTabs({
  activeTab,
  boardPath,
  listPath,
  activityPath,
  trailing,
}: SprintViewTabsProps) {
  const tabPaths: Record<SprintViewTab, string> = {
    Board: boardPath,
    List: listPath,
    Activity: activityPath,
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-devflow-border bg-devflow-card px-4">
      <nav
        className="flex items-center gap-0.5 -mb-px"
        aria-label="Sprint views"
      >
        {tabs.map((tab) => (
          <Link
            key={tab}
            to={tabPaths[tab]}
            className={cn(
              'relative px-3 py-2 text-nav transition-colors',
              tab === activeTab
                ? 'font-medium text-devflow-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-devflow-primary'
                : 'text-devflow-text-secondary hover:text-devflow-text',
            )}
          >
            {tab}
          </Link>
        ))}
      </nav>
      {trailing ? (
        <div className="flex shrink-0 items-center py-1.5">{trailing}</div>
      ) : null}
    </div>
  )
}
