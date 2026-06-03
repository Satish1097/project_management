import {
  Archive,
  Bug,
  CheckSquare,
  FolderKanban,
  HelpCircle,
  LayoutGrid,
  Plus,
  Rocket,
  Settings,
  Zap,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { DevFlowLogo } from '@/components/brand/DevFlowLogo'
import { layout } from '@/constants/layout'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'My Tasks', icon: CheckSquare, path: ROUTES.myTasks },
  { label: 'Projects', icon: FolderKanban, path: ROUTES.workspaceEmpty },
  { label: 'Board', icon: LayoutGrid, path: ROUTES.board },
  { label: 'Ops Center', icon: Zap, path: ROUTES.operations },
  { label: 'QA', icon: Bug, path: ROUTES.qa },
  { label: 'Releases', icon: Rocket, path: ROUTES.releases },
  { label: 'Settings', icon: Settings, path: ROUTES.projectSettings },
] as const

export function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className={cn(layout.shellSidebar, 'justify-between')}>
      <div className="flex flex-col gap-0.5 p-4">
        <div className="flex items-center gap-3 pb-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-devflow-primary">
            <DevFlowLogo />
          </div>
          <div>
            <p className="text-brand text-devflow-primary">
              DevFlow
              <br />
              Ops
            </p>
            <p className="text-body text-devflow-text-secondary">
              Software Team
            </p>
          </div>
        </div>

        <button
          type="button"
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-devflow-primary py-1.5 text-btn text-white shadow-[0px_1px_1px_rgba(0,0,0,0.05)]"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
          New Issue
        </button>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active =
              label === 'Projects'
                ? pathname === ROUTES.dashboard ||
                  pathname === ROUTES.workspaceEmpty
                : label === 'Board'
                  ? pathname === ROUTES.board ||
                    pathname.startsWith('/board/')
                  : pathname === path || pathname.startsWith(`${path}/`)

            return (
              <Link
                key={label}
                to={path}
                className={cn(
                  layout.navItem,
                  'text-body text-devflow-text-secondary transition-colors',
                  active && 'bg-[#d0e1fb] text-[#54647a]',
                )}
              >
                <Icon className="size-5 shrink-0" strokeWidth={1.75} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-devflow-border px-4 pb-4 pt-3">
        <Link
          to="#"
          className={cn(layout.navItem, 'text-body text-devflow-text-secondary hover:bg-white/60')}
        >
          <HelpCircle className="size-5" strokeWidth={1.75} />
          Help
        </Link>
        <Link
          to="#"
          className={cn(layout.navItem, 'text-body text-devflow-text-secondary hover:bg-white/60')}
        >
          <Archive className="size-[18px]" strokeWidth={1.75} />
          Archive
        </Link>
      </div>
    </aside>
  )
}
