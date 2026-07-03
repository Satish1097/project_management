/**
 * Pure-function verification for replaceProjectInPath (no browser).
 * Mirrors routes.ts logic exactly.
 */
function projectPath(projectId) {
  return `/projects/${projectId}`
}

function projectBacklogPath(projectId) {
  return `${projectPath(projectId)}/backlog`
}

function projectSprintsPath(projectId) {
  return `${projectPath(projectId)}/sprints`
}

function replaceProjectInPath(pathname, projectId) {
  const projectMatch = pathname.match(/^\/projects\/[^/]+(?<suffix>\/.*)?$/)
  if (!projectMatch) return projectBacklogPath(projectId)

  const suffix = projectMatch.groups?.suffix ?? ''
  if (suffix.startsWith('/sprints/')) {
    return projectSprintsPath(projectId)
  }

  return `/projects/${projectId}${suffix}`
}

const PROJECT_A = 'e469fbbc-bdee-4063-829f-633857064298'
const PROJECT_B = 'f309bc7e-86ff-492e-851f-14bf0d6d39fc'

const cases = [
  { pathname: `/projects/${PROJECT_A}/board`, projectId: PROJECT_B },
  { pathname: `/projects/${PROJECT_A}/backlog`, projectId: PROJECT_B },
  { pathname: `/projects/${PROJECT_A}`, projectId: PROJECT_B },
  { pathname: `/projects/${PROJECT_A}/sprints/abc-123/board`, projectId: PROJECT_B },
  { pathname: '/', projectId: PROJECT_B },
  { pathname: '/tasks', projectId: PROJECT_B },
  { pathname: `/projects/${PROJECT_A}/settings/general`, projectId: PROJECT_B },
]

console.log('=== replaceProjectInPath verification ===\n')
for (const { pathname, projectId } of cases) {
  const returned = replaceProjectInPath(pathname, projectId)
  console.log(`Current pathname:  ${pathname}`)
  console.log(`Target projectId:  ${projectId}`)
  console.log(`Returned pathname: ${returned}`)
  console.log(`Would navigate:    ${returned !== pathname}`)
  console.log('---')
}
