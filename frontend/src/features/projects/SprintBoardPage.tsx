import { Navigate, useParams } from 'react-router-dom'
import { sprintAdvancedBoardPath } from '@/constants/routes'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { IssueBoardView } from '@/features/tasks/IssueBoardView'
import { useSprintBoard } from '@/features/tasks/useSprintBoard'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { getProjectById, getSprintById } from '@/services/projectData'
import '@/features/tasks/issues-board.css'

export function SprintBoardPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { loading: sprintsLoading } = useLoadProjectSprints(projectId)
  const { columns, tasksByStatus, totalVisible, moveTaskToStatus, loading, error } =
    useSprintBoard(projectId, sprintId)

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  if (sprintsLoading && !sprint) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-devflow-surface p-8 text-body text-devflow-text-secondary">
        Loading sprint…
      </div>
    )
  }

  if (!sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-devflow-surface">
      <BoardFilters
        advancedBoardPath={sprintAdvancedBoardPath(projectId, sprintId)}
      />
      <main className="relative min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
        {error && (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">{error}</p>
          </div>
        )}
        {!error && loading && totalVisible === 0 && (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">Loading sprint board…</p>
          </div>
        )}
        {!error && !loading && totalVisible === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">No issues on the board</p>
            <p className="issue-board-empty__hint">
              Add issues to this sprint or adjust filters to see them here.
            </p>
          </div>
        ) : !error ? (
          <IssueBoardView
            tasksByStatus={tasksByStatus}
            onMoveTask={moveTaskToStatus}
            columns={columns}
          />
        ) : null}
      </main>
    </div>
  )
}
