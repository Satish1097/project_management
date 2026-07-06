import { Navigate, useParams } from 'react-router-dom'
import { projectSprintsPath } from '@/constants/routes'
import { ProjectKanbanPage } from '@/features/kanban/ProjectKanbanPage'

/** Sprint-scoped board — requires .../sprints/:sprintId/board. */
export function SprintBoardPage() {
  const { projectId = '', sprintId } = useParams<{
    projectId: string
    sprintId?: string
  }>()

  if (!sprintId) {
    return <Navigate to={projectSprintsPath(projectId)} replace />
  }

  return <ProjectKanbanPage />
}
