import { HelpCircle } from 'lucide-react'
import { layout } from '@/constants/layout'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { cn } from '@/utils/cn'

const tabs = ['All Issues', 'Active', 'Backlog'] as const

type EmptyWorkspaceHeaderProps = {
  activeTab?: (typeof tabs)[number]
}

export function EmptyWorkspaceHeader({
  activeTab = 'All Issues',
}: EmptyWorkspaceHeaderProps) {
  return (
    <header className={cn(layout.appHeader, 'bg-[rgba(247,249,251,0.8)] backdrop-blur-[2px]')}>
      <div className="flex items-center gap-4">
        <span className="text-brand text-[#004191]">
          DevFlow
        </span>
        <nav className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'text-nav',
                tab === activeTab
                  ? 'text-[#004191]'
                  : 'text-[#424753]',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell className="rounded-full text-[#424753] hover:bg-white/60" />
        <button
          type="button"
          className="rounded-full p-2 text-[#424753] hover:bg-white/60"
          aria-label="Help"
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
        </button>
        <Avatar
          name="You"
          color="#94a3b8"
          size={28}
          className="border border-devflow-border"
        />
        <button
          type="button"
          className="rounded-lg bg-[#004191] px-3 py-1 text-btn text-white"
        >
          New Issue
        </button>
      </div>
    </header>
  )
}
