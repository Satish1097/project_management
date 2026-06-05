import { Navigate, useParams } from 'react-router-dom'
import { sprintAdvancedBoardPath } from '@/constants/routes'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { IssueBoardView } from '@/features/tasks/IssueBoardView'
import { useSprintBoard } from '@/features/tasks/useSprintBoard'
import { getProjectById, getSprintById } from '@/services/projectData'
import '@/features/tasks/issues-board.css'

export function SprintBoardPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { columns, tasksByStatus, totalVisible, moveTaskToStatus } =
    useSprintBoard(projectId, sprintId)

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-devflow-surface">
      <BoardFilters
        advancedBoardPath={sprintAdvancedBoardPath(projectId, sprintId)}
      />
      <main className="relative min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
        {totalVisible === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">No issues on the board</p>
            <p className="issue-board-empty__hint">
              Add issues to this sprint or adjust filters to see them here.
            </p>
          </div>
        ) : (
          <IssueBoardView
            tasksByStatus={tasksByStatus}
            onMoveTask={moveTaskToStatus}
            columns={columns}
          />
        )}
      </main>
    </div>
  )
}
