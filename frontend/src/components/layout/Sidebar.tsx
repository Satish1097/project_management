import {
  Archive,
  Bug,
  CheckSquare,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Rocket,
  Settings,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { SidebarBrand } from '@/components/brand/SidebarBrand'
import { useSidebar } from '@/contexts/SidebarContext'
import { layout } from '@/constants/layout'
import { ROUTES, isProjectsArea } from '@/constants/routes'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.dashboard },
  { label: 'My Tasks', icon: CheckSquare, path: ROUTES.myTasks },
  { label: 'Projects', icon: FolderKanban, path: ROUTES.projects },
  { label: 'QA', icon: Bug, path: ROUTES.qa },
  { label: 'Releases', icon: Rocket, path: ROUTES.releases },
  { label: 'Settings', icon: Settings, path: ROUTES.workspaceProjectSettings },
] as const

export function Sidebar() {
  const { pathname } = useLocation()
  const { collapsed, toggle } = useSidebar()

  return (
    <aside className={cn(layout.shellSidebar, 'justify-between overflow-hidden')}>
      <div
        className={cn(
          'flex flex-col gap-0.5',
          collapsed ? 'items-center px-2 py-3' : 'p-4',
        )}
      >
        <div className={cn('w-full', collapsed ? 'flex justify-center pb-2' : 'pb-2')}>
          <SidebarBrand
            collapsed={collapsed}
            titleClassName="text-devflow-primary"
          />
        </div>

        <button
          type="button"
          title="New Issue"
          className={cn(
            'flex items-center rounded-lg bg-devflow-primary text-btn text-white shadow-devflow-sm hover:opacity-95',
            collapsed
              ? 'mb-3 size-9 justify-center'
              : 'mb-4 w-full justify-center gap-1.5 py-1.5',
          )}
        >
          <Plus className="size-3.5 shrink-0" strokeWidth={2.5} />
          {!collapsed && <span>New Issue</span>}
        </button>

        <nav className={cn('flex flex-col gap-1', collapsed && 'w-full items-center')}>
          {navItems.map(({ label, icon: Icon, path }) => {
            const active =
              label === 'Dashboard'
                ? pathname === ROUTES.dashboard
                : label === 'Projects'
                  ? isProjectsArea(pathname)
                  : label === 'Settings'
                    ? pathname.startsWith('/projects/settings')
                    : pathname === path || pathname.startsWith(`${path}/`)

            return (
              <Link
                key={label}
                to={path}
                title={collapsed ? label : undefined}
                className={cn(
                  layout.navItem,
                  'text-body text-devflow-text-secondary transition-colors',
                  collapsed && 'w-9 justify-center px-0',
                  active && 'bg-devflow-nav-active-alt text-devflow-nav-active-text-alt',
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      <div
        className={cn(
          'border-t border-devflow-border',
          collapsed ? 'flex flex-col items-center gap-1 px-2 py-3' : 'px-4 pb-4 pt-3',
        )}
      >
        <Link
          to="#"
          title={collapsed ? 'Help' : undefined}
          className={cn(
            layout.navItem,
            'text-body text-devflow-text-secondary hover:bg-devflow-hover-overlay',
            collapsed && 'w-9 justify-center px-0',
          )}
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
          {!collapsed && 'Help'}
        </Link>
        <Link
          to="#"
          title={collapsed ? 'Archive' : undefined}
          className={cn(
            layout.navItem,
            'text-body text-devflow-text-secondary hover:bg-devflow-hover-overlay',
            collapsed && 'w-9 justify-center px-0',
          )}
        >
          <Archive className="size-[18px]" strokeWidth={1.75} />
          {!collapsed && 'Archive'}
        </Link>
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            layout.navItem,
            'mt-1 w-full text-body text-devflow-text-muted hover:bg-devflow-hover-overlay',
            collapsed && 'w-9 justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-5 shrink-0" strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose className="size-5 shrink-0" strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
