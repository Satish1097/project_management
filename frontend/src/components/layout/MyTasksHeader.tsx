import { layout } from '@/constants/layout'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/utils/cn'

const tabs = ['All Issues', 'Active', 'Backlog'] as const

export function MyTasksHeader() {
  return (
    <header className={cn(layout.appHeader, 'header-glass backdrop-blur-[6px]')}>
      <div className="flex items-center gap-4">
        <h1 className="text-section-title font-bold text-devflow-brand">
          My Tasks
        </h1>
        <nav className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'pb-1.5 text-nav',
                tab === 'All Issues'
                  ? 'border-b-2 border-devflow-brand font-bold text-devflow-brand'
                  : 'font-medium text-devflow-text-secondary',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell className="text-devflow-text-secondary hover:bg-devflow-hover-overlay" />
        <Avatar
          name="You"
          color="#94a3b8"
          size={28}
          className="border border-devflow-border"
        />
      </div>
    </header>
  )
}
