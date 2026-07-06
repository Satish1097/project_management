type TracePayload = Record<string, unknown>

export type ProjectSwitchTraceEvent = {
  step: string
  file: string
  fn: string
  ts: number
  payload: TracePayload
}

declare global {
  interface Window {
    __PROJECT_SWITCH_TRACE__?: ProjectSwitchTraceEvent[]
  }
}

const ENABLED = import.meta.env.DEV

function pushEvent(step: string, file: string, fn: string, payload: TracePayload) {
  if (!ENABLED) return

  const event: ProjectSwitchTraceEvent = {
    step,
    file,
    fn,
    ts: Date.now(),
    payload,
  }

  if (typeof window !== 'undefined') {
    window.__PROJECT_SWITCH_TRACE__ ??= []
    window.__PROJECT_SWITCH_TRACE__.push(event)
  }

  console.log(`[PROJECT_SWITCH] ${step}`, { file, fn, ...payload })
}

export const projectSwitchTrace = {
  sidebarContextPanelMount(collapsed: boolean) {
    pushEvent('1-sidebar-mount', 'SidebarContextPanel.tsx', 'SidebarContextPanel', {
      collapsed,
      rendered: true,
    })
  },

  handleProjectChange(
    projectId: string,
    pathname: string,
    nextPathname: string,
    willNavigate: boolean,
  ) {
    pushEvent('1-handleProjectChange', 'SidebarContextPanel.tsx', 'handleProjectChange', {
      projectId,
      currentPathname: pathname,
      nextPathname,
      pathnamesDiffer: nextPathname !== pathname,
      willNavigate,
      browserUrlBefore: typeof window !== 'undefined' ? window.location.pathname : null,
    })
  },

  navigateCalled(from: string, to: string, replace: boolean) {
    pushEvent('1-navigate', from, 'navigate', {
      to,
      replace,
      browserUrlAfter: typeof window !== 'undefined' ? window.location.pathname : null,
    })
  },

  replaceProjectInPath(input: string, projectId: string, output: string) {
    pushEvent('2-replaceProjectInPath', 'routes.ts', 'replaceProjectInPath', {
      currentPathname: input,
      projectId,
      returnedPathname: output,
    })
  },

  projectShellRender(
    projectId: string,
    projectFromList: string | null,
    projectFromRegistry: string | null,
  ) {
    pushEvent('3-projectShell', 'ProjectShell.tsx', 'ProjectShell', {
      projectIdFromParams: projectId,
      projectFromUseProjects: projectFromList,
      projectFromRegistry: projectFromRegistry,
    })
  },

  locationChange(previous: string, next: string) {
    pushEvent('4-router-location', 'react-router', 'useLocation', {
      previousPathname: previous,
      newPathname: next,
      identical: previous === next,
    })
  },

  appShellSyncProject(pathname: string, projectId: string, action: 'skip' | 'set') {
    pushEvent('5-appShell-sync', 'AppShell.tsx', 'AppShellLayout effect', {
      pathname,
      projectId,
      action,
    })
  },

  projectsContextFallback(fallbackId: string, routeProjectId: string | undefined) {
    pushEvent('6-projectsContext-fallback', 'ProjectsContext.tsx', 'fallback effect', {
      fallbackId,
      routeProjectId,
    })
  },

  setCurrentProject(from: string, projectId: string) {
    pushEvent('6-setCurrentProject', from, 'setCurrentProject', { projectId })
  },

  redirect(from: string, fn: string, to: string) {
    pushEvent('5-redirect', from, fn, { to })
  },
}
