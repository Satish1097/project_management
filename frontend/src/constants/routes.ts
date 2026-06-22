/**
 * Central route path definitions and helpers.
 * Keep paths stable here so navigation, guards, and links stay in sync.
 */
export const ROUTES = {
  // Authentication (guest)
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',

  // Workspace
  dashboard: '/',
  myTasks: '/tasks',
  projects: '/projects',
  sprints: '/sprints',
  roadmaps: '/roadmaps',
  workspaceEmpty: '/workspace/empty',
  workspaceActivity: '/workspace/activity',
  search: '/search',
  notifications: '/notifications',
  workspaceSettings: '/workspace/settings',

  // Workspace-level project settings (legacy path)
  workspaceProjectSettings: '/projects/settings',
  projectSettingsLabels: '/projects/settings/labels',

  // Delivery modules (workspace scope)
  operations: '/operations',
  qa: '/qa',
  releases: '/releases',

  // Legacy board paths — redirect to project/sprint context
  boardLegacy: '/board',
  advancedBoardLegacy: '/board/advanced',
  issueDetailLegacy: '/board/issue',
  issueDetailEnhancedLegacy: '/board/issue/enhanced',

  // Errors
  notFound: '/404',
  forbidden: '/403',
} as const

/** Project workspace: /projects/:projectId/... */
export function projectPath(projectId: string) {
  return `/projects/${projectId}`
}

export function projectOverviewPath(projectId: string) {
  return projectPath(projectId)
}

export function projectBacklogPath(projectId: string) {
  return `${projectPath(projectId)}/backlog`
}

export function projectKanbanPath(projectId: string) {
  return `${projectPath(projectId)}/board`
}

/** Primary project board route — all issues, never sprint-scoped. */
export const projectBoardPath = projectKanbanPath

/** Project-wide board (all issues) — not a sprint-scoped board. */
export function isProjectBoardPath(pathname: string): boolean {
  return /\/projects\/[^/]+\/board\/?$/.test(pathname)
}

/** Sprint-scoped board views (board / list / activity). */
export function isSprintBoardPath(pathname: string): boolean {
  return /\/sprints\/[^/]+\/board(?:\/|$)/.test(pathname)
}

export function projectSprintsPath(projectId: string) {
  return `${projectPath(projectId)}/sprints`
}

export function projectActivityPath(projectId: string) {
  return `${projectPath(projectId)}/activity`
}

export function projectTeamPath(projectId: string) {
  return `${projectPath(projectId)}/team`
}

export function projectReleasesPath(projectId: string) {
  return `${projectPath(projectId)}/releases`
}

export function projectReportsPath(projectId: string) {
  return `${projectPath(projectId)}/reports`
}

export function projectSettingsPath(projectId: string) {
  return `${projectPath(projectId)}/settings`
}

export function projectSettingsGeneralPath(projectId: string) {
  return `${projectSettingsPath(projectId)}/general`
}

export function projectSettingsMembersPath(projectId: string) {
  return `${projectSettingsPath(projectId)}/members`
}

export function projectSettingsStatusesPath(projectId: string) {
  return `${projectSettingsPath(projectId)}/statuses`
}

export function projectSettingsLabelsPath(projectId: string) {
  return `${projectSettingsPath(projectId)}/labels`
}

export function projectSettingsIntegrationsPath(projectId: string) {
  return `${projectSettingsPath(projectId)}/integrations`
}

export function isProjectSettingsPath(pathname: string, projectId: string): boolean {
  return pathname.startsWith(`${projectSettingsPath(projectId)}/`)
}

export function sprintDetailPath(projectId: string, sprintId: string) {
  return `${projectPath(projectId)}/sprints/${sprintId}`
}

export function sprintPlanningPath(projectId: string, sprintId: string) {
  return `${projectPath(projectId)}/sprints/${sprintId}/planning`
}

export function sprintBoardPath(projectId: string, sprintId: string) {
  return `${projectPath(projectId)}/sprints/${sprintId}/board`
}

export function sprintListPath(projectId: string, sprintId: string) {
  return `${projectPath(projectId)}/sprints/${sprintId}/list`
}

export function sprintActivityPath(projectId: string, sprintId: string) {
  return `${projectPath(projectId)}/sprints/${sprintId}/activity`
}

export function sprintAdvancedBoardPath(projectId: string, sprintId: string) {
  return `${projectPath(projectId)}/sprints/${sprintId}/board/advanced`
}

export function sprintIssueDetailPath(
  projectId: string,
  sprintId: string,
) {
  return `${projectPath(projectId)}/sprints/${sprintId}/board/issue`
}

export function sprintIssueDetailEnhancedPath(
  projectId: string,
  sprintId: string,
) {
  return `${projectPath(projectId)}/sprints/${sprintId}/board/issue/enhanced`
}

/** Default board context for mock/demo links */
export const DEFAULT_BOARD_CONTEXT = {
  projectId: '1',
  sprintId: 'sprint-42',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const AUTH_ROUTE_PATHS: readonly AppRoute[] = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]

export const PUBLIC_ROUTE_PATHS: readonly AppRoute[] = [
  ...AUTH_ROUTE_PATHS,
  ROUTES.notFound,
  ROUTES.forbidden,
]

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PATHS.includes(pathname as AppRoute)
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PATHS.includes(pathname as AppRoute)
}

export type SidebarNavId =
  | 'dashboard'
  | 'myTasks'
  | 'projects'
  | 'sprints'
  | 'qa'
  | 'releases'
  | 'roadmaps'
  | 'settings'

/** Workspace-level Sprints module (not project-scoped /projects/:id/sprints). */
export function isSprintsArea(pathname: string): boolean {
  return (
    pathname === ROUTES.sprints ||
    pathname.startsWith(`${ROUTES.sprints}/`)
  )
}

export function isRoadmapsArea(pathname: string): boolean {
  return (
    pathname === ROUTES.roadmaps ||
    pathname.startsWith(`${ROUTES.roadmaps}/`)
  )
}

/** /projects/:projectId/... — project workspace (overview, sprints, settings, etc.). */
export function isProjectContextPath(pathname: string): boolean {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  if (!match) return false
  // Legacy workspace path without a project id: /projects/settings
  return match[1] !== 'settings'
}

/** /projects/:projectId/settings/* — project configuration context. */
export function isProjectSettingsRoute(pathname: string): boolean {
  return (
    /^\/projects\/[^/]+\/settings(?:\/|$)/.test(pathname) ||
    pathname === ROUTES.workspaceProjectSettings ||
    pathname.startsWith(`${ROUTES.workspaceProjectSettings}/`)
  )
}

/** Global workspace settings — not project-scoped settings. */
export function isGlobalSettingsPath(pathname: string): boolean {
  return (
    pathname === ROUTES.workspaceSettings ||
    pathname.startsWith(`${ROUTES.workspaceSettings}/`) ||
    pathname === '/settings' ||
    pathname.startsWith('/settings/')
  )
}

/** Sidebar Settings item: project settings or workspace/global settings. */
export function isSidebarSettingsActive(pathname: string): boolean {
  return isProjectSettingsRoute(pathname) || isGlobalSettingsPath(pathname)
}

export function isProjectsArea(pathname: string): boolean {
  return (
    pathname === ROUTES.projects ||
    (isProjectContextPath(pathname) && !isProjectSettingsRoute(pathname))
  )
}


export function parseProjectRoute(pathname: string): {
  projectId?: string
  sprintId?: string
} {
  const match = pathname.match(
    /^\/projects\/([^/]+)(?:\/sprints\/([^/]+))?/,
  )
  if (!match) return {}
  return { projectId: match[1], sprintId: match[2] }
}

export type SprintModuleTab =
  | 'Overview'
  | 'Board'
  | 'List'
  | 'Activity'
  | 'Planning'

export function isSprintModulePath(pathname: string): boolean {
  return /\/projects\/[^/]+\/sprints\/[^/]+(\/(board|list|activity|planning))?\/?$/.test(
    pathname,
  )
}

export function isSprintViewPath(pathname: string): boolean {
  return /\/sprints\/[^/]+\/(board|list|activity)(?:\/|$)/.test(pathname)
}

export function resolveSprintViewTab(
  pathname: string,
): 'Board' | 'List' | 'Activity' | undefined {
  if (pathname.endsWith('/list')) return 'List'
  if (pathname.endsWith('/activity')) return 'Activity'
  if (/\/sprints\/[^/]+\/board(?:\/|$)/.test(pathname)) return 'Board'
  return undefined
}

export function resolveSprintModuleTab(
  pathname: string,
): SprintModuleTab | undefined {
  if (pathname.endsWith('/planning')) return 'Planning'
  if (pathname.endsWith('/list')) return 'List'
  if (pathname.endsWith('/activity')) return 'Activity'
  if (/\/sprints\/[^/]+\/board(?:\/|$)/.test(pathname)) return 'Board'
  if (/\/projects\/[^/]+\/sprints\/[^/]+\/?$/.test(pathname)) return 'Overview'
  return undefined
}
