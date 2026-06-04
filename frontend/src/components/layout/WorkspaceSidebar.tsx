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
import { SidebarBrand } from '@/components/brand/SidebarBrand'
import { layout } from '@/constants/layout'
import {
  ROUTES,
  isProjectsArea,
  resolveWorkspaceActiveNav,
  type WorkspaceNavId,
} from '@/constants/routes'
import { cn } from '@/utils/cn'

const navItems: {
  id: WorkspaceNavId
  label: string
  icon: typeof Search
  path: string
}[] = [
  { id: 'search', label: 'Search', icon: Search, path: ROUTES.search },
  { id: 'inbox', label: 'Inbox', icon: Inbox, path: ROUTES.notifications },
  { id: 'myIssues', label: 'My Issues', icon: ListChecks, path: ROUTES.myTasks },
  { id: 'projects', label: 'Projects', icon: LayoutGrid, path: ROUTES.projects },
  { id: 'cycles', label: 'Cycles', icon: Calendar, path: '#' },
  { id: 'roadmaps', label: 'Roadmaps', icon: Map, path: '#' },
]

export function WorkspaceSidebar() {
  const { pathname } = useLocation()
  const activeNav = resolveWorkspaceActiveNav(pathname)

  const resolveActive = (id: WorkspaceNavId, path: string) => {
    if (activeNav) return activeNav === id
    if (id === 'myIssues') return pathname === ROUTES.myTasks
    if (id === 'projects') return isProjectsArea(pathname)
    return pathname === path
  }

  return (
    <aside className={cn(layout.shellSidebar, 'px-3 py-3')}>
      <div className="pb-2">
        <SidebarBrand />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon, path }) => (
          <Link
            key={id}
            to={path}
            className={cn(
              layout.navItem,
              'text-body text-devflow-text-secondary',
              resolveActive(id, path) && 'bg-devflow-nav-active text-devflow-nav-active-text',
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
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-devflow-brand-deep py-1.5 text-btn text-white shadow-devflow-sm"
        >
          <Plus className="size-2.5" strokeWidth={2.5} />
          Create Issue
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-0.5 border-t border-devflow-border pt-3">
        <Link
          to={ROUTES.workspaceProjectSettings}
          className={cn(
            layout.navItem,
            'text-nav text-devflow-text-secondary hover:bg-devflow-hover-overlay',
            pathname.startsWith('/projects/settings') && 'bg-devflow-nav-active text-devflow-nav-active-text',
          )}
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
