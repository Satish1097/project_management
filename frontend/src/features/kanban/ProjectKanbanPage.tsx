import { useCallback, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ApiError } from '@/api/types'
import { transitionIssue } from '@/api/issues'
import { projectSprintsPath } from '@/constants/routes'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { KanbanBoardView } from '@/features/kanban/KanbanBoardView'
import { useProjectKanban } from '@/features/kanban/useProjectKanban'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { getProjectById, getSprintById } from '@/services/projectData'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ProjectKanbanPage() {
  const { projectId = '', sprintId } = useParams<{
    projectId: string
    sprintId?: string
  }>()
  const project = getProjectById(projectId)
  const sprint = sprintId ? getSprintById(projectId, sprintId) : undefined
  const { loading: sprintsLoading } = useLoadProjectSprints(projectId)
  const boardReady =
    !sprintId || (!sprintsLoading && !!sprint && UUID_RE.test(sprintId))
  const [transitioningIssueId, setTransitioningIssueId] = useState<string | null>(null)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const {
    columns,
    loading,
    error,
    totalIssues,
    filteredIssueCount,
    filters,
    setFilters,
    clearFilters,
    assigneeOptions,
    refreshBoard,
  } = useProjectKanban(projectId, { sprintId, enabled: boardReady })

  const handleTransitionIssue = useCallback(
    async (issueId: string, targetStatusId: string) => {
      setTransitionError(null)
      setTransitioningIssueId(issueId)

      try {
        await transitionIssue(issueId, targetStatusId)
        await refreshBoard()
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to transition issue.'
        setTransitionError(message)
      } finally {
        setTransitioningIssueId(null)
      }
    },
    [refreshBoard],
  )

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  if (sprintId) {
    if (sprintsLoading && !sprint) {
      return (
        <div className="flex min-h-0 flex-1 items-center justify-center bg-devflow-surface p-8 text-body text-devflow-text-secondary">
          Loading sprint…
        </div>
      )
    }

    if (!sprint || !UUID_RE.test(sprintId)) {
      return <Navigate to={projectSprintsPath(projectId)} replace />
    }
  }

  const showFilteredEmpty = !loading && totalIssues > 0 && filteredIssueCount === 0
  const emptyHint = sprintId
    ? 'Add issues to this sprint or adjust filters to see them here.'
    : 'Adjust assignee, priority, or label filters to see issues.'

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-devflow-surface">
      <BoardFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        assigneeOptions={assigneeOptions}
      />
      <main className="relative min-h-0 flex-1 overflow-auto px-4 pb-4 pt-3">
        {error && (
          <p className="mb-3 rounded-lg border border-devflow-error/30 bg-devflow-error/5 px-3 py-2 text-body text-devflow-error">
            {error}
          </p>
        )}
        {transitionError && (
          <p className="mb-3 rounded-lg border border-devflow-error/30 bg-devflow-error/5 px-3 py-2 text-body text-devflow-error">
            {transitionError}
          </p>
        )}

        <div className="mb-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void refreshBoard()}
            disabled={loading}
            className="rounded-lg border border-devflow-border bg-devflow-card px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-surface disabled:opacity-50"
          >
            Refresh board
          </button>
        </div>

        {loading && columns.length === 0 && totalIssues === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">
              {sprintId ? 'Loading sprint board…' : 'Loading board…'}
            </p>
          </div>
        ) : showFilteredEmpty ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">No issues match filters</p>
            <p className="issue-board-empty__hint">{emptyHint}</p>
          </div>
        ) : !loading && totalIssues === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">No issues on the board</p>
            <p className="issue-board-empty__hint">{emptyHint}</p>
          </div>
        ) : (
          <KanbanBoardView
            columns={columns}
            onTransitionIssue={handleTransitionIssue}
            transitioningIssueId={transitioningIssueId}
          />
        )}
      </main>
    </div>
  )
}
