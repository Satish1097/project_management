import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { KanbanColumn } from '@/features/kanban/KanbanColumn'
import { getKanbanColumnsForSprint } from '@/services/issuesRegistry'
import { getProjectById, getSprintById } from '@/services/projectData'
import { useIssues } from '@/contexts/IssuesContext'
import { useCreateIssue } from '@/contexts/CreateIssueContext'

export function SprintBoardPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { issues } = useIssues()
  const { openCreateIssue } = useCreateIssue()
  const columns = useMemo(
    () => getKanbanColumnsForSprint(projectId, sprintId),
    [issues, projectId, sprintId],
  )

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <>
      <BoardFilters onCreateIssue={() => openCreateIssue()} />
      <main className="relative flex-1 p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              projectId={projectId}
              sprintId={sprintId}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => openCreateIssue()}
          className="fixed bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-devflow-primary text-white shadow-devflow-lg"
          aria-label="Create issue"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </main>
    </>
  )
}

