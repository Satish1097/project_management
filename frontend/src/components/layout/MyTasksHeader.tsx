import { layout } from '@/constants/layout'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { cn } from '@/utils/cn'

const tabs = ['All Issues', 'Active', 'Backlog'] as const

export function MyTasksHeader() {
  return (
    <header className={cn(layout.appHeader, 'bg-[rgba(247,249,251,0.8)] backdrop-blur-[6px]')}>
      <div className="flex items-center gap-4">
        <h1 className="text-section-title font-bold text-[#004191]">
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
                  ? 'border-b-2 border-[#004191] font-bold text-[#004191]'
                  : 'font-medium text-[#424753]',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell className="text-[#424753] hover:bg-white/60" />
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
