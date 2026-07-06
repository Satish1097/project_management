import { layout } from '@/constants/layout'
import { UserAvatar } from '@/components/ui/UserAvatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useAuth } from '@/features/auth/AuthProvider'
import { avatarColorFromName } from '@/features/members/memberUtils'
import { cn } from '@/utils/cn'

const tabs = ['All Issues', 'Active', 'Backlog'] as const

export function MyTasksHeader() {
  const { user } = useAuth()
  const currentUserName = user?.display_name || user?.email || 'You'
  const currentUserColor = avatarColorFromName(currentUserName)

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
        <UserAvatar
          name={currentUserName}
          color={currentUserColor}
          size={28}
          userId={user?.id}
          email={user?.email}
          className="border border-devflow-border"
        />
      </div>
    </header>
  )
}
