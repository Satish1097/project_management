/**
 * Central route path definitions and helpers.
 * Keep paths stable here so navigation, guards, and links stay in sync.
 */
export const ROUTES = {
  // Authentication (guest)
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',

  // Main app (ops shell — Sidebar)
  dashboard: '/',
  board: '/board',
  advancedBoard: '/board/advanced',
  issueDetail: '/board/issue',
  issueDetailEnhanced: '/board/issue/enhanced',
  operations: '/operations',
  qa: '/qa',
  releases: '/releases',
  projectSettings: '/projects/settings',

  // Workspace shell (WorkspaceSidebar)
  myTasks: '/tasks',
  workspaceEmpty: '/workspace/empty',
  search: '/search',
  notifications: '/notifications',
  workspaceSettings: '/workspace/settings',
  projectSettingsLabels: '/projects/settings/labels',

  // Errors
  notFound: '/404',
  forbidden: '/403',
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

export function resolveWorkspaceActiveNav(
  pathname: string,
): WorkspaceNavId | undefined {
  if (pathname === ROUTES.search) return 'search'
  if (pathname === ROUTES.notifications) return 'inbox'
  if (pathname === ROUTES.myTasks) return 'myIssues'
  if (
    pathname === ROUTES.workspaceEmpty ||
    pathname === ROUTES.dashboard ||
    pathname === ROUTES.workspaceSettings ||
    pathname === ROUTES.projectSettingsLabels ||
    pathname.startsWith('/projects/settings')
  ) {
    return 'projects'
  }
  return undefined
}
