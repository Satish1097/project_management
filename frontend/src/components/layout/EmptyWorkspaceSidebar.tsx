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
import { SidebarBrand } from '@/components/brand/SidebarBrand'
import { layout } from '@/constants/layout'
import { ROUTES } from '@/constants/routes'
import { useCreateIssue } from '@/contexts/CreateIssueContext'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Search', icon: Search, path: ROUTES.search },
  { label: 'Inbox', icon: Inbox, path: ROUTES.notifications },
  { label: 'My Issues', icon: ListChecks, path: ROUTES.myTasks },
  { label: 'Projects', icon: LayoutGrid, path: ROUTES.projects },
  { label: 'Cycles', icon: Calendar, path: '#' },
  { label: 'Roadmaps', icon: Map, path: '#' },
] as const

export function EmptyWorkspaceSidebar() {
  const { pathname } = useLocation()
  const { openCreateIssue } = useCreateIssue()

  return (
    <aside className={cn(layout.shellSidebar, 'px-3 py-3')}>
      <div className="border-b border-transparent pb-2">
        <SidebarBrand />
      </div>

      <button
        type="button"
        onClick={() => openCreateIssue()}
        className="my-3 flex w-full items-center justify-center gap-1 rounded-lg bg-devflow-brand-deep py-1.5 text-btn text-white"
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
                'text-body text-devflow-text-secondary',
                active && 'bg-devflow-nav-active text-devflow-nav-active-text',
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
          className={cn(layout.navItem, 'text-nav text-devflow-text-secondary hover:bg-devflow-hover-overlay')}
        >
          <Settings className="size-5" strokeWidth={1.75} />
          Settings
        </Link>
        <Link
          to="#"
          className={cn(layout.navItem, 'text-nav text-devflow-text-secondary hover:bg-devflow-hover-overlay')}
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
          Support
        </Link>
      </div>
    </aside>
  )
}
