import { HelpCircle } from 'lucide-react'
import { BRANDING } from '@/constants/branding'
import { layout } from '@/constants/layout'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/features/auth/AuthProvider'
import { avatarColorFromName } from '@/features/members/memberUtils'
import { cn } from '@/utils/cn'

const tabs = ['All Issues', 'Active', 'Backlog'] as const

type EmptyWorkspaceHeaderProps = {
  activeTab?: (typeof tabs)[number]
}

export function EmptyWorkspaceHeader({
  activeTab = 'All Issues',
}: EmptyWorkspaceHeaderProps) {
  const { user } = useAuth()
  const currentUserName = user?.display_name || user?.email || 'You'
  const currentUserColor = avatarColorFromName(currentUserName)

  return (
    <header className={cn(layout.appHeader, 'header-glass backdrop-blur-[2px]')}>
      <div className="flex items-center gap-4">
        <span className="text-brand text-devflow-brand">
          {BRANDING.appName}
        </span>
        <nav className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'text-nav',
                tab === activeTab
                  ? 'text-devflow-brand'
                  : 'text-devflow-text-secondary',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBell className="rounded-full text-devflow-text-secondary hover:bg-devflow-hover-overlay" />
        <button
          type="button"
          className="rounded-full p-2 text-devflow-text-secondary hover:bg-devflow-hover-overlay"
          aria-label="Help"
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
        </button>
        <UserAvatar
          name={currentUserName}
          color={currentUserColor}
          size={28}
          userId={user?.id}
          email={user?.email}
          className="border border-devflow-border"
        />
        <button
          type="button"
          className="rounded-lg bg-devflow-brand-deep px-3 py-1 text-btn text-white"
        >
          New Issue
        </button>
      </div>
    </header>
  )
}
