/** Centralized application branding — update here for future renames. */
export const BRANDING = {
  appName: 'HKPMS',
  tagline: 'Project Management',
  /** Sidebar wordmark subtitle — single line, compact */
  sidebarTagline: 'Project Management',
  loginTagline: 'Streamlined project management',
  signupTagline: 'Start managing your projects today.',
  logoPath: '/logo.png',
  faviconPath: '/logo.png',
  documentTitle: 'HKPMS',
  projectNameDefault: 'HKPMS Ops',
  projectCoreName: 'HKPMS Core',
  opsCenterName: 'HKPMS Ops Center',
  qaName: 'HKPMS QA',
  workspaceAccessCopy:
    'Manage who has access to the HKPMS workspace and their permission levels.',
  /** Sidebar wordmark logo — balanced with 20–24px title */
  sidebarLogoSizePx: 46,
  /** Active project board context (header) — replace with route/API data later */
  boardContext: {
    projectName: 'Payment Gateway System',
    sprintName: 'Sprint 42',
    sprintStatus: 'Active Sprint',
  },
} as const
