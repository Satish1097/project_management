import { Navigate, useParams } from 'react-router-dom'
import { IssueListView } from '@/features/tasks/IssueListView'
import { useEffect, useMemo } from 'react'
import { useIssues } from '@/contexts/IssuesContext'
import { getProjectById, getSprintById } from '@/services/projectData'
import { projectIssueToBoardTask } from '@/utils/projectIssueBoard'

export function SprintListPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { issues, loadSprintIssues, sprintIssuesLoading, sprintIssuesError } = useIssues()

  useEffect(() => {
    if (!projectId || !sprintId) return
    void loadSprintIssues(projectId, sprintId)
  }, [projectId, sprintId, loadSprintIssues])

  const sprintTasks = useMemo(
    () =>
      issues
        .filter((issue) => issue.projectId === projectId && issue.sprintId === sprintId)
        .map((issue) => projectIssueToBoardTask(issue, project)),
    [issues, projectId, sprintId, project],
  )

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <main className="page-main p-3">
      {sprintIssuesError ? (
        <div className="rounded-lg border border-devflow-error/30 bg-devflow-error/5 px-4 py-3 text-body text-devflow-error">
          {sprintIssuesError}
        </div>
      ) : null}
      {sprintIssuesLoading && sprintTasks.length === 0 ? (
        <div className="rounded-lg border border-devflow-border bg-devflow-card px-4 py-3 text-body text-devflow-text-secondary">
          Loading sprint issues…
        </div>
      ) : (
        <IssueListView tasks={sprintTasks} />
      )}
    </main>
  )
}

