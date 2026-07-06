import { Navigate } from 'react-router-dom'
import { projectBoardPath, ROUTES } from '@/constants/routes'
import { getProjectById } from '@/services/projectData'
import { mockProjects } from '@/services/mockProjects'

/** Sends legacy /board URLs to the first project's all-issues board. */
export function BoardLegacyRedirect() {
  for (const project of mockProjects) {
    if (getProjectById(project.id)) {
      return <Navigate to={projectBoardPath(project.id)} replace />
    }
  }

  return <Navigate to={ROUTES.projects} replace />
}
