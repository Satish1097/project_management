import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { sprintAdvancedBoardPath } from '@/constants/routes'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { KanbanColumn } from '@/features/kanban/KanbanColumn'
import { getKanbanColumnsForSprint } from '@/services/issuesRegistry'
import { getProjectById, getSprintById } from '@/services/projectData'
import { useIssues } from '@/contexts/IssuesContext'
import '@/features/tasks/issues-board.css'

export function SprintBoardPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { issues } = useIssues()
  const columns = useMemo(
    () => getKanbanColumnsForSprint(projectId, sprintId),
    [issues, projectId, sprintId],
  )

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  const totalIssues = columns.reduce((sum, col) => sum + col.count, 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-devflow-surface">
      <BoardFilters
        advancedBoardPath={sprintAdvancedBoardPath(projectId, sprintId)}
      />
      <main className="relative min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
        {totalIssues === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">No issues on the board</p>
            <p className="issue-board-empty__hint">
              Add issues to this sprint or adjust filters to see them here.
            </p>
          </div>
        ) : (
          <div
            className="issue-board-scroll"
            role="region"
            aria-label="Kanban board"
            tabIndex={0}
          >
            <div className="issue-board-track">
              {columns.map((column) => (
                <KanbanColumn key={column.id} column={column} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

