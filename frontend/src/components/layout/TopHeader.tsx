import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { layout } from '@/constants/layout'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { cn } from '@/utils/cn'

const tabs = ['Board', 'List', 'Activity'] as const

type Tab = (typeof tabs)[number]

type TopHeaderProps = {
  variant?: 'board' | 'projects'
  activeTab?: Tab
}

export function TopHeader({
  variant = 'board',
  activeTab = 'Board',
}: TopHeaderProps) {
  if (variant === 'projects') {
    return (
      <header className={cn(layout.appHeader, 'bg-white')}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#6b7280]" />
            <Link
              to={ROUTES.search}
              className="relative block w-52 rounded-lg bg-[#f2f4f6] py-1.5 pl-9 pr-3 text-body text-[#6b7280] hover:ring-2 hover:ring-devflow-primary/20"
            >
              Search projects...
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  'pb-1 text-nav',
                  tab === activeTab
                    ? 'border-b-2 border-devflow-primary text-devflow-primary'
                    : 'text-devflow-text-secondary',
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <Avatar
            name="You"
            color="#94a3b8"
            size={28}
            className="border border-devflow-border bg-[#f1f5f9]"
          />
        </div>
      </header>
    )
  }

  return (
    <header className={cn(layout.appHeader, 'bg-white')}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-4">
          <span className="text-brand text-devflow-text">
            DevFlow
          </span>
          <span className="h-4 w-px bg-devflow-border" />
          <span className="text-nav text-devflow-text-secondary">
            Sprint 42
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'pb-1 text-nav',
                tab === activeTab
                  ? 'border-b-2 border-devflow-primary text-devflow-primary'
                  : 'text-devflow-text-secondary',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-[#6b7280]" />
          <Link
            to={ROUTES.search}
            className="relative block w-52 rounded-lg bg-[#f2f4f6] py-1.5 pl-9 pr-3 text-body text-[#6b7280] hover:ring-2 hover:ring-devflow-primary/20"
          >
            Search issues...
          </Link>
        </div>
        <NotificationBell />
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
