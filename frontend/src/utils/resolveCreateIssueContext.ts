import { matchPath } from 'react-router-dom'
import { isProjectBoardPath, isSprintBoardPath } from '@/constants/routes'

export type CreateIssueSource = 'global' | 'backlog' | 'board' | 'project'

export type CreateIssueDefaults = {
  projectId?: string
  sprintId?: string | null
  source: CreateIssueSource
}

function isBoardContextPath(pathname: string): boolean {
  return (
    isProjectBoardPath(pathname) ||
    isSprintBoardPath(pathname) ||
    matchPath(
      { path: '/projects/:projectId/sprints/:sprintId/board/*', end: false },
      pathname,
    ) !== null
  )
}

export function resolveCreateIssueContext(pathname: string): CreateIssueDefaults {
  const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
  const projectId = projectMatch?.[1]

  const sprintMatch = pathname.match(
    /\/projects\/[^/]+\/sprints\/([^/]+)(?:\/|$)/,
  )
  const sprintId = sprintMatch?.[1]

  if (!projectId) {
    return { source: 'global' }
  }

  if (pathname.includes('/backlog')) {
    return { projectId, sprintId: null, source: 'backlog' }
  }

  if (isBoardContextPath(pathname)) {
    return { projectId, sprintId: sprintId ?? null, source: 'board' }
  }

  return { projectId, sprintId: null, source: 'project' }
}
