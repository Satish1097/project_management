import { Navigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { KanbanColumn } from '@/features/kanban/KanbanColumn'
import { kanbanColumns } from '@/services/mockKanban'
import { getProjectById, getSprintById } from '@/services/projectData'

export function SprintBoardPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <>
      <BoardFilters />
      <main className="relative flex-1 p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {kanbanColumns.map((column) => (
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
          className="fixed bottom-4 right-4 flex size-11 items-center justify-center rounded-full bg-devflow-primary text-white shadow-devflow-lg"
          aria-label="Quick add"
        >
          <Plus className="size-3.5" strokeWidth={2.5} />
        </button>
      </main>
    </>
  )
}
