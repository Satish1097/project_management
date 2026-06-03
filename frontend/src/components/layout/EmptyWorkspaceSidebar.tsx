import {
  Calendar,
  Inbox,
  LayoutGrid,
  Map,
  Plus,
  Search,
  Settings,
  HelpCircle,
  ListChecks,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { DevFlowLogo } from '@/components/brand/DevFlowLogo'
import { layout } from '@/constants/layout'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Search', icon: Search, path: ROUTES.search },
  { label: 'Inbox', icon: Inbox, path: ROUTES.notifications },
  { label: 'My Issues', icon: ListChecks, path: ROUTES.myTasks },
  { label: 'Projects', icon: LayoutGrid, path: ROUTES.workspaceEmpty },
  { label: 'Cycles', icon: Calendar, path: '#' },
  { label: 'Roadmaps', icon: Map, path: '#' },
] as const

export function EmptyWorkspaceSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className={cn(layout.shellSidebar, 'px-3 py-3')}>
      <div className="border-b border-transparent pb-4">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-[25px] items-center justify-center rounded-lg bg-devflow-primary">
            <DevFlowLogo className="h-4 w-5" />
          </div>
          <div>
            <p className="text-brand text-[#004191]">
              DevFlow
              <br />
              Workspace
            </p>
            <p className="text-caption text-[#424753]">
              Engineering Team
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="my-3 flex w-full items-center justify-center gap-1 rounded-lg bg-[#004191] py-1.5 text-btn text-white"
      >
        <Plus className="size-2.5" strokeWidth={2.5} />
        Create Issue
      </button>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = pathname === path
          return (
            <Link
              key={label}
              to={path}
              className={cn(
                layout.navItem,
                'text-body text-[#424753]',
                active && 'bg-[#d4e3ff] text-[#56657c]',
              )}
            >
              <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-devflow-border pt-4">
        <Link
          to="#"
          className={cn(layout.navItem, 'text-nav text-[#424753] hover:bg-white/60')}
        >
          <Settings className="size-5" strokeWidth={1.75} />
          Settings
        </Link>
        <Link
          to="#"
          className={cn(layout.navItem, 'text-nav text-[#424753] hover:bg-white/60')}
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
          Support
        </Link>
      </div>
    </aside>
  )
}
