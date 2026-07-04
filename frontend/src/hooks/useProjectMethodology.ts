import { useParams } from 'react-router-dom'
import { useProjects } from '@/contexts/ProjectsContext'
import { getProjectById } from '@/services/projectData'
import type { BoardType, ProjectMethodology } from '@/types/projects'

export type ProjectMethodologyState = {
  methodology: ProjectMethodology
  boardType: BoardType
  isScrum: boolean
  isKanban: boolean
}

export function useProjectMethodology(
  projectIdOverride?: string,
): ProjectMethodologyState {
  const { projectId: routeProjectId = '' } = useParams()
  const projectId = projectIdOverride ?? routeProjectId
  const { projects } = useProjects()

  const project =
    projects.find((item) => item.id === projectId) ?? getProjectById(projectId)

  const methodology: ProjectMethodology = project?.methodology ?? 'scrum'
  const boardType: BoardType = project?.boardType ?? 'scrum'

  return {
    methodology,
    boardType,
    isScrum: methodology === 'scrum',
    isKanban: methodology === 'kanban',
  }
}
