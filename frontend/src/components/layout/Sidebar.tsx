import { useState } from 'react'
import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  User,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SidebarBrand } from '@/components/brand/SidebarBrand'
import { SidebarContextPanel } from '@/components/layout/SidebarContextPanel'
import {
  SidebarNavButton,
  SidebarNavLink,
  SidebarNavSection,
} from '@/components/layout/SidebarNavSection'
import {
  WORKSPACE_NAV_ITEMS,
  getProjectNavItemsForMethodology,
  getQuickActionItemsForMethodology,
  isProfileNavActive,
  isProjectNavActive,
  projectNavPath,
  workspaceNavPath,
  isWorkspaceNavActive,
} from '@/components/layout/sidebarNav'
import { useCreateIssue } from '@/contexts/CreateIssueContext'
import { useSidebar } from '@/contexts/SidebarContext'
import { parseProjectRoute, projectBoardPath, ROUTES } from '@/constants/routes'
import { layout } from '@/constants/layout'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAppContext } from '@/features/context/useAppContext'
import { CreateSprintDrawer } from '@/features/sprints/CreateSprintDrawer'
import { useProjectMethodology } from '@/hooks/useProjectMethodology'
import { cn } from '@/utils/cn'

export function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { collapsed, toggle } = useSidebar()
  const { logout } = useAuth()
  const { openCreateIssue } = useCreateIssue()
  const { currentProject } = useAppContext()
  const { projectId: routeProjectId } = parseProjectRoute(pathname)
  const projectId = routeProjectId ?? currentProject?.id ?? null
  const [createSprintOpen, setCreateSprintOpen] = useState(false)
  const { methodology, isScrum } = useProjectMethodology(projectId ?? undefined)
  const projectNavItems = getProjectNavItemsForMethodology(methodology)
  const quickActionItems = getQuickActionItemsForMethodology(methodology)

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.login)
  }

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'createIssue') {
      openCreateIssue(projectId ? { projectId } : undefined)
      return
    }
    if (actionId === 'createSprint' && projectId) {
      setCreateSprintOpen(true)
    }
  }

  return (
    <aside
      className={cn(
        layout.shellSidebar,
        'dark:border-zinc-800 dark:bg-zinc-950',
      )}
    >
      {/* Fixed header — brand + context selectors (never scrolls) */}
      <div className={cn('sidebar-header', collapsed && 'px-2')}>
        <div
          className={cn(
            'w-full shrink-0',
            collapsed ? 'flex justify-center' : undefined,
          )}
        >
          <SidebarBrand collapsed={collapsed} titleClassName="text-devflow-primary" />
        </div>
        <SidebarContextPanel collapsed={collapsed} />
      </div>

      {/* Scrollable navigation only */}
      <nav
        className={cn('sidebar-nav-scroll', collapsed && 'items-center px-2')}
        aria-label="Sidebar navigation"
      >
        {projectId && (
          <SidebarNavSection label="Project" collapsed={collapsed}>
            {projectNavItems.map(({ id, label, icon }) => (
              <SidebarNavLink
                key={id}
                to={
                  id === 'board'
                    ? projectBoardPath(projectId)
                    : projectNavPath(projectId, id)
                }
                label={label}
                icon={icon}
                active={isProjectNavActive(pathname, projectId, id)}
                collapsed={collapsed}
              />
            ))}
          </SidebarNavSection>
        )}

        <SidebarNavSection label="Workspace" collapsed={collapsed}>
          {WORKSPACE_NAV_ITEMS.map(({ id, label, icon }) => (
            <SidebarNavLink
              key={id}
              to={workspaceNavPath(id, projectId)}
              label={label}
              icon={icon}
              active={isWorkspaceNavActive(pathname, id)}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <SidebarNavSection label="Quick Actions" collapsed={collapsed}>
          {quickActionItems.map(({ id, label, icon }) => (
            <SidebarNavButton
              key={id}
              label={label}
              icon={icon}
              collapsed={collapsed}
              disabled={id === 'createSprint' && !projectId}
              onClick={() => handleQuickAction(id)}
            />
          ))}
        </SidebarNavSection>
      </nav>

      {/* Fixed footer — user + collapse */}
      <div className={cn('sidebar-footer', collapsed && 'px-2')}>
        <SidebarNavSection label="User" collapsed={collapsed}>
          <SidebarNavLink
            to={ROUTES.dashboard}
            label="Profile"
            icon={User}
            active={isProfileNavActive(pathname)}
            collapsed={collapsed}
          />
          <SidebarNavButton
            label="Logout"
            icon={LogOut}
            collapsed={collapsed}
            onClick={() => void handleLogout()}
          />
        </SidebarNavSection>

        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'sidebar-nav-item mt-2 text-devflow-text-muted',
            'hover:text-devflow-text-secondary dark:text-zinc-500 dark:hover:text-zinc-400',
            collapsed && 'sidebar-nav-item--collapsed',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="sidebar-nav-icon" strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose className="sidebar-nav-icon" strokeWidth={1.75} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {projectId && isScrum ? (
        <CreateSprintDrawer
          open={createSprintOpen}
          onClose={() => setCreateSprintOpen(false)}
          projectId={projectId}
        />
      ) : null}
    </aside>
  )
}
