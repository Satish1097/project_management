import {
  Calendar,
  Inbox,
  LayoutGrid,
  ListChecks,
  Map,
  Plus,
  Search,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { DevFlowLogo } from '@/components/brand/DevFlowLogo'
import { layout } from '@/constants/layout'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

type WorkspaceNavId = 'search' | 'inbox' | 'myIssues' | 'projects' | 'cycles' | 'roadmaps'

const navItems: {
  id: WorkspaceNavId
  label: string
  icon: typeof Search
  path: string
}[] = [
  { id: 'search', label: 'Search', icon: Search, path: ROUTES.search },
  { id: 'inbox', label: 'Inbox', icon: Inbox, path: ROUTES.notifications },
  { id: 'myIssues', label: 'My Issues', icon: ListChecks, path: ROUTES.myTasks },
  { id: 'projects', label: 'Projects', icon: LayoutGrid, path: ROUTES.workspaceEmpty },
  { id: 'cycles', label: 'Cycles', icon: Calendar, path: '#' },
  { id: 'roadmaps', label: 'Roadmaps', icon: Map, path: '#' },
]

type WorkspaceSidebarProps = {
  activeNav?: WorkspaceNavId
}

export function WorkspaceSidebar({ activeNav }: WorkspaceSidebarProps) {
  const { pathname } = useLocation()

  const resolveActive = (id: WorkspaceNavId, path: string) => {
    if (activeNav) return activeNav === id
    if (id === 'myIssues') return pathname === ROUTES.myTasks
    if (id === 'projects')
      return (
        pathname === ROUTES.workspaceEmpty || pathname === ROUTES.dashboard
      )
    return pathname === path
  }

  return (
    <aside className={cn(layout.shellSidebar, 'px-3 py-3')}>
      <div className="pb-4">
        <div className="flex items-center gap-2 px-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#004191]">
            <DevFlowLogo className="h-4 w-5" />
          </div>
          <div>
            <p className="text-brand text-[#004191]">
              DevFlow
            </p>
            <p className="text-caption-label tracking-[0.5px] text-[#727784]">
              Engineering Team
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon, path }) => (
          <Link
            key={id}
            to={path}
            className={cn(
              layout.navItem,
              'text-body text-[#424753]',
              resolveActive(id, path) && 'bg-[#d4e3ff] text-[#56657c]',
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#004191] py-1.5 text-btn text-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <Plus className="size-2.5" strokeWidth={2.5} />
          Create Issue
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-0.5 border-t border-devflow-border pt-3">
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
