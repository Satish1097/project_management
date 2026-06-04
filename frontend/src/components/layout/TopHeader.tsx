import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { BRANDING } from '@/constants/branding'
import { layout } from '@/constants/layout'
import { ROUTES } from '@/constants/routes'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/utils/cn'

const tabs = ['Board', 'List', 'Activity'] as const

type Tab = (typeof tabs)[number]

type TopHeaderProps = {
  variant?: 'board' | 'projects'
  activeTab?: Tab
  /** Project shown on board header — defaults to active board context */
  projectName?: string
  sprintName?: string
  sprintStatus?: string
}

export function TopHeader({
  variant = 'board',
  activeTab = 'Board',
  projectName = BRANDING.boardContext.projectName,
  sprintName = BRANDING.boardContext.sprintName,
  sprintStatus = BRANDING.boardContext.sprintStatus,
}: TopHeaderProps) {
  if (variant === 'projects') {
    return (
      <header className={layout.appHeader}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-devflow-icon-muted" />
            <Link
              to={ROUTES.search}
              className="relative block w-52 rounded-lg bg-devflow-muted py-1.5 pl-9 pr-3 text-body text-devflow-icon-muted hover:ring-2 hover:ring-devflow-primary/20"
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
          <ThemeToggle />
          <NotificationBell />
          <Avatar
            name="You"
            color="#94a3b8"
            size={28}
            className="border border-devflow-border bg-devflow-avatar-bg"
          />
        </div>
      </header>
    )
  }

  return (
    <header className={cn(layout.appHeader, 'app-header-context')}>
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <div
          className="min-w-0 shrink border-r border-devflow-border pr-4 sm:pr-5"
          aria-label={`${projectName}, ${sprintName}, ${sprintStatus}`}
        >
          <Link
            to={ROUTES.dashboard}
            className="block truncate text-nav font-semibold leading-tight text-devflow-text transition-colors hover:text-devflow-primary"
            title={projectName}
          >
            {projectName}
          </Link>
          <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-caption leading-tight text-devflow-text-secondary">
            <span className="font-medium text-devflow-text">{sprintName}</span>
            <span aria-hidden className="text-devflow-text-muted">
              •
            </span>
            <span className="text-devflow-success">{sprintStatus}</span>
          </p>
        </div>
        <nav
          className="flex shrink-0 items-center gap-3 sm:gap-4"
          aria-label="Board views"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={cn(
                'pb-1 text-nav whitespace-nowrap',
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

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-devflow-icon-muted" />
          <Link
            to={ROUTES.search}
            className="relative block w-44 rounded-lg bg-devflow-muted py-1.5 pl-9 pr-3 text-body text-devflow-icon-muted hover:ring-2 hover:ring-devflow-primary/20 lg:w-52"
          >
            Search issues...
          </Link>
        </div>
        <Link
          to={ROUTES.search}
          className="flex size-8 items-center justify-center rounded-lg text-devflow-icon-muted hover:bg-devflow-muted md:hidden"
          aria-label="Search issues"
        >
          <Search className="size-[18px]" />
        </Link>
        <ThemeToggle />
        <NotificationBell />
        <Avatar
          name="You"
          color="#94a3b8"
          size={28}
          className="border border-devflow-border bg-devflow-avatar-bg"
        />
      </div>
    </header>
  )
}
