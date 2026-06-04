import { Navigate } from 'react-router-dom'
import { ROUTES, sprintBoardPath } from '@/constants/routes'
import { getActiveSprint, getProjectById } from '@/services/projectData'
import { mockProjects } from '@/services/mockProjects'

/** Sends legacy /board URLs to the first project with an active sprint board. */
export function BoardLegacyRedirect() {
  for (const project of mockProjects) {
    const sprint = getActiveSprint(project.id)
    if (sprint && getProjectById(project.id)) {
      return (
        <Navigate to={sprintBoardPath(project.id, sprint.id)} replace />
      )
    }
  }

  return <Navigate to={ROUTES.projects} replace />
}
