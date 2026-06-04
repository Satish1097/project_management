import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { sprintAdvancedBoardPath } from '@/constants/routes'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { KanbanColumn } from '@/features/kanban/KanbanColumn'
import { getKanbanColumnsForSprint } from '@/services/issuesRegistry'
import { getProjectById, getSprintById } from '@/services/projectData'
import { useIssues } from '@/contexts/IssuesContext'

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

  return (
    <>
      <BoardFilters
        advancedBoardPath={sprintAdvancedBoardPath(projectId, sprintId)}
      />
      <main className="flex-1 px-4 pb-4 pt-3">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>
      </main>
    </>
  )
}

