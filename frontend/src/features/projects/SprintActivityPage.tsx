import { Navigate, useParams } from 'react-router-dom'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { getProjectById, getSprintById } from '@/services/projectData'

export function SprintActivityPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <main className="page-main p-3">
      <ActivityFeed />
    </main>
  )
}
