export type CreateIssueSource = 'global' | 'backlog' | 'board' | 'project'

export type CreateIssueDefaults = {
  projectId?: string
  sprintId?: string | null
  source: CreateIssueSource
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

  if (pathname.includes('/board')) {
    return { projectId, sprintId: sprintId ?? null, source: 'board' }
  }

  if (sprintId && pathname.includes('/planning')) {
    return { projectId, sprintId, source: 'board' }
  }

  return { projectId, sprintId: null, source: 'project' }
}
