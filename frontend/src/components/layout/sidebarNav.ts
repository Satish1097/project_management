import type { LucideIcon } from 'lucide-react'
import {
  Bug,
  Calendar,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Map,
  Rocket,
  Settings,
} from 'lucide-react'
import {
  ROUTES,
  isProjectsArea,
  isRoadmapsArea,
  isSidebarSettingsActive,
  isSprintsArea,
  type SidebarNavId,
} from '@/constants/routes'

export type SidebarNavItem = {
  id: SidebarNavId
  label: string
  icon: LucideIcon
  path: string
}

/** Global app sidebar — same order and labels on every page. */
export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.dashboard },
  { id: 'myTasks', label: 'My Tasks', icon: CheckSquare, path: ROUTES.myTasks },
  { id: 'projects', label: 'Projects', icon: FolderKanban, path: ROUTES.projects },
  { id: 'sprints', label: 'Sprints', icon: Calendar, path: ROUTES.sprints },
  { id: 'qa', label: 'QA', icon: Bug, path: ROUTES.qa },
  { id: 'releases', label: 'Releases', icon: Rocket, path: ROUTES.releases },
  { id: 'roadmaps', label: 'Roadmaps', icon: Map, path: ROUTES.roadmaps },
  { id: 'settings', label: 'Settings', icon: Settings, path: ROUTES.workspaceSettings },
] as const

export function resolveSidebarActiveNav(
  pathname: string,
): SidebarNavId | undefined {
  if (pathname === ROUTES.search || pathname === ROUTES.notifications) {
    return undefined
  }
  if (pathname === ROUTES.dashboard) return 'dashboard'
  if (
    pathname === ROUTES.myTasks ||
    pathname.startsWith(`${ROUTES.myTasks}/`)
  ) {
    return 'myTasks'
  }
  if (isSidebarSettingsActive(pathname)) return 'settings'
  if (isSprintsArea(pathname)) return 'sprints'
  if (isRoadmapsArea(pathname)) return 'roadmaps'
  if (pathname === ROUTES.qa || pathname.startsWith(`${ROUTES.qa}/`)) {
    return 'qa'
  }
  if (
    pathname === ROUTES.releases ||
    pathname.startsWith(`${ROUTES.releases}/`)
  ) {
    return 'releases'
  }
  if (isProjectsArea(pathname) || pathname === ROUTES.workspaceEmpty) {
    return 'projects'
  }
  return undefined
}

export function isSidebarNavItemActive(
  id: SidebarNavId,
  pathname: string,
): boolean {
  return resolveSidebarActiveNav(pathname) === id
}
