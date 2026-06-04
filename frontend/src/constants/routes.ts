/**
 * Central route path definitions and helpers.
 * Keep paths stable here so navigation, guards, and links stay in sync.
 */
export const ROUTES = {
  // Authentication (guest)
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',

  // Workspace
  dashboard: '/',
  myTasks: '/tasks',
  projects: '/projects',
  workspaceEmpty: '/workspace/empty',
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

export function projectSprintsPath(projectId: string) {
  return `${projectPath(projectId)}/sprints`
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
  projectId: '3',
  sprintId: 'sprint-15',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]

export const AUTH_ROUTE_PATHS: readonly AppRoute[] = [
  ROUTES.login,
  ROUTES.signup,
  ROUTES.forgotPassword,
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

export type WorkspaceNavId =
  | 'search'
  | 'inbox'
  | 'myIssues'
  | 'projects'
  | 'cycles'
  | 'roadmaps'

export function isProjectsArea(pathname: string): boolean {
  return (
    pathname === ROUTES.projects ||
    pathname.startsWith('/projects/') &&
      !pathname.startsWith('/projects/settings')
  )
}

export function resolveWorkspaceActiveNav(
  pathname: string,
): WorkspaceNavId | undefined {
  if (pathname === ROUTES.search) return 'search'
  if (pathname === ROUTES.notifications) return 'inbox'
  if (pathname === ROUTES.myTasks) return 'myIssues'
  if (isProjectsArea(pathname) || pathname === ROUTES.workspaceEmpty) {
    return 'projects'
  }
  return undefined
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
