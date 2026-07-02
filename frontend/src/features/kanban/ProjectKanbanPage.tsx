import { useCallback, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '@/api/types'
import { projectSprintsPath } from '@/constants/routes'
import { useIssues } from '@/contexts/IssuesContext'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { BoardViewSwitcher } from '@/features/kanban/BoardViewSwitcher'
import { KanbanBoardView } from '@/features/kanban/KanbanBoardView'
import { useBoardViewMode } from '@/features/kanban/useBoardViewMode'
import { useProjectIssueList } from '@/features/kanban/useProjectIssueList'
import { useProjectKanban } from '@/features/kanban/useProjectKanban'
import { IssueListView } from '@/features/tasks/IssueListView'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { getProjectById, getSprintById } from '@/services/projectData'
import { syncProjectOpenIssueCount } from '@/services/projectStats'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ProjectKanbanPage() {
  const { projectId = '', sprintId } = useParams<{
    projectId: string
    sprintId?: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const project = getProjectById(projectId)
  const sprint = sprintId ? getSprintById(projectId, sprintId) : undefined
  const { loading: sprintsLoading } = useLoadProjectSprints(projectId)
  const boardReady =
    !sprintId || (!sprintsLoading && !!sprint && UUID_RE.test(sprintId))
  const { viewMode, setViewMode } = useBoardViewMode()
  const isListView = viewMode === 'list'
  const [transitioningIssueId, setTransitioningIssueId] = useState<string | null>(null)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const { transitionIssueViaApi } = useIssues()
  const {
    columns,
    loading: boardLoading,
    error: boardError,
    totalIssues,
    filteredIssueCount,
    filters,
    setFilters,
    clearFilters,
    assigneeOptions,
    refreshBoard,
  } = useProjectKanban(projectId, {
    sprintId,
    enabled: boardReady && !isListView,
  })
  const {
    tasks: listTasks,
    loading: listLoading,
    error: listError,
    pagination: listPagination,
    refreshList,
    handlePageChange,
  } = useProjectIssueList({
    project: project!,
    sprintId,
    enabled: boardReady && isListView && !!project,
    filters,
    searchParams,
    setSearchParams,
  })

  const handleTransitionIssue = useCallback(
    async (issueId: string, targetStatusId: string) => {
      setTransitionError(null)
      setTransitioningIssueId(issueId)

      try {
        await transitionIssueViaApi(issueId, projectId, targetStatusId)
        void syncProjectOpenIssueCount(projectId)
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to transition issue.'
        setTransitionError(message)
      } finally {
        setTransitioningIssueId(null)
      }
    },
    [transitionIssueViaApi, projectId],
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

  const loading = isListView ? listLoading : boardLoading
  const error = isListView ? listError : boardError
  const showFilteredEmpty =
    !isListView && !boardLoading && totalIssues > 0 && filteredIssueCount === 0
  const showListEmpty =
    isListView && !listLoading && (listPagination?.totalCount ?? 0) === 0
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
            onClick={() => void (isListView ? refreshList() : refreshBoard())}
            disabled={loading}
            className="rounded-lg border border-devflow-border bg-devflow-card px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-surface disabled:opacity-50"
          >
            Refresh board
          </button>
          <BoardViewSwitcher value={viewMode} onChange={setViewMode} />
        </div>

        {isListView ? (
          listLoading && listTasks.length === 0 ? (
            <div className="issue-board-empty">
              <p className="issue-board-empty__title">
                {sprintId ? 'Loading sprint issues…' : 'Loading issues…'}
              </p>
            </div>
          ) : showListEmpty ? (
            <div className="issue-board-empty">
              <p className="issue-board-empty__title">No issues match filters</p>
              <p className="issue-board-empty__hint">{emptyHint}</p>
            </div>
          ) : (
            <>
              <IssueListView
                tasks={listTasks}
                pagination={
                  listPagination
                    ? {
                        ...listPagination,
                        onPageChange: handlePageChange,
                      }
                    : null
                }
              />
            </>
          )
        ) : boardLoading && columns.length === 0 && totalIssues === 0 ? (
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
        ) : !boardLoading && totalIssues === 0 ? (
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
