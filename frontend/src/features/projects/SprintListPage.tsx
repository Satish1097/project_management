import { Navigate, useParams } from 'react-router-dom'
import { IssueListView } from '@/features/tasks/IssueListView'
import { useIssues } from '@/features/tasks/useIssues'
import { getProjectById, getSprintById } from '@/services/projectData'

export function SprintListPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)

  const { visibleTasks } = useIssues()

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <main className="page-main p-3">
      <IssueListView tasks={visibleTasks} />
    </main>
  )
}
