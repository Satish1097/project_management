/**
 * Semantic layout class names — backed by styles/layout.css
 */
export const layout = {
  shellSidebar: 'shell-sidebar',
  shellMain: 'shell-main',
  appHeader: 'app-header',
  pageMain: 'page-main',
  pageStack: 'page-stack',
  uiCard: 'ui-card',
  uiCardMuted: 'ui-card-muted',
  navItem: 'nav-item',
  btnCompact: 'btn-compact',
} as const

/** Main content min-height below sticky header */
export const MAIN_BELOW_HEADER = 'min-h-[calc(100vh-var(--height-header))]'
