import type { LucideIcon } from 'lucide-react'
import {
  Calendar,
  FolderKanban,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Plus,
  Settings,
  Users,
} from 'lucide-react'
import {
  ROUTES,
  isProjectBoardPath,
  projectBacklogPath,
  projectBoardPath,
  projectOverviewPath,
  projectSettingsMembersPath,
  projectSettingsPath,
  projectSprintsPath,
} from '@/constants/routes'

export type SidebarProjectNavId =
  | 'overview'
  | 'backlog'
  | 'board'
  | 'sprints'
  | 'members'
  | 'settings'

export type SidebarWorkspaceNavId = 'projects' | 'teamMembers'

export type SidebarNavLinkItem = {
  id: string
  label: string
  icon: LucideIcon
  path: string
  disabled?: boolean
}

export type SidebarNavActionItem = {
  id: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}

export type SidebarNavGroup = {
  id: string
  label: string
  items: SidebarNavLinkItem[]
}

export const PROJECT_NAV_ITEMS: readonly {
  id: SidebarProjectNavId
  label: string
  icon: LucideIcon
}[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'backlog', label: 'Backlog', icon: ListTodo },
  { id: 'board', label: 'Board', icon: Kanban },
  { id: 'sprints', label: 'Sprints', icon: Calendar },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export const WORKSPACE_NAV_ITEMS: readonly {
  id: SidebarWorkspaceNavId
  label: string
  icon: LucideIcon
}[] = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'teamMembers', label: 'Team Members', icon: Users },
] as const

export const QUICK_ACTION_ITEMS: readonly SidebarNavActionItem[] = [
  { id: 'createIssue', label: 'Create Issue', icon: Plus },
  { id: 'createSprint', label: 'Create Sprint', icon: Plus },
] as const

export function projectNavPath(
  projectId: string,
  navId: SidebarProjectNavId,
): string {
  switch (navId) {
    case 'overview':
      return projectOverviewPath(projectId)
    case 'backlog':
      return projectBacklogPath(projectId)
    case 'board':
      return projectBoardPath(projectId)
    case 'sprints':
      return projectSprintsPath(projectId)
    case 'members':
      return projectSettingsMembersPath(projectId)
    case 'settings':
      return `${projectSettingsPath(projectId)}/general`
  }
}

export function isProjectNavActive(
  pathname: string,
  projectId: string,
  navId: SidebarProjectNavId,
): boolean {
  const base = projectOverviewPath(projectId)
  if (navId === 'overview') {
    return pathname === base
  }
  if (navId === 'board') {
    return isProjectBoardPath(pathname)
  }
  if (navId === 'backlog') {
    return pathname.startsWith(projectBacklogPath(projectId))
  }
  if (navId === 'sprints') {
    return /\/projects\/[^/]+\/sprints/.test(pathname)
  }
  if (navId === 'members') {
    return pathname.startsWith(projectSettingsMembersPath(projectId))
  }
  if (navId === 'settings') {
    return (
      pathname.startsWith(projectSettingsPath(projectId)) &&
      !pathname.startsWith(projectSettingsMembersPath(projectId))
    )
  }
  return false
}

export function workspaceNavPath(
  navId: SidebarWorkspaceNavId,
  projectId?: string | null,
): string {
  if (navId === 'projects') return ROUTES.projects
  if (projectId) return projectSettingsMembersPath(projectId)
  return ROUTES.workspaceSettings
}

export function isWorkspaceNavActive(
  pathname: string,
  navId: SidebarWorkspaceNavId,
): boolean {
  if (navId === 'projects') {
    return pathname === ROUTES.projects || pathname === ROUTES.workspaceEmpty
  }
  if (navId === 'teamMembers') {
    return /\/settings\/members(?:\/|$)/.test(pathname)
  }
  return false
}

export function isProfileNavActive(pathname: string): boolean {
  return pathname === ROUTES.dashboard
}
