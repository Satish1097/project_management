import { useCallback, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { transitionIssue as apiTransitionIssue } from '@/api/issues'
import { ApiError } from '@/api/types'
import { projectSprintsPath } from '@/constants/routes'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import { BoardViewSwitcher } from '@/features/kanban/BoardViewSwitcher'
import {
  parseKanbanFiltersFromSearchParams,
  syncKanbanFiltersToSearchParams,
} from '@/features/kanban/boardFilterParams'
import { KanbanBoardView } from '@/features/kanban/KanbanBoardView'
import { DEFAULT_KANBAN_FILTERS } from '@/features/kanban/kanbanFilters'
import { useBoardFilterMetadata } from '@/features/kanban/useBoardFilterMetadata'
import { useBoardViewMode } from '@/features/kanban/useBoardViewMode'
import { useProjectIssueList } from '@/features/kanban/useProjectIssueList'
import { useProjectKanban } from '@/features/kanban/useProjectKanban'
import { IssueListView } from '@/features/tasks/IssueListView'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { getProjectById, getSprintById } from '@/services/projectData'
import { mapIssueDetailToUi } from '@/services/mapIssueApi'
import { upsertApiIssue } from '@/services/issuesRegistry'
import { syncProjectOpenIssueCount } from '@/services/projectStats'
import type { KanbanBoardFilters } from '@/types/kanban'

export function ProjectKanbanPage() {
  const { projectId = '', sprintId } = useParams<{
    projectId: string
    sprintId?: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const project = getProjectById(projectId)
  const sprint = sprintId ? getSprintById(projectId, sprintId) : undefined
  const { loading: sprintsLoading } = useLoadProjectSprints(projectId)
  const boardReady = !sprintId || (!sprintsLoading && !!sprint)
  const { viewMode, setViewMode } = useBoardViewMode()
  const isListView = viewMode === 'list'
  const [transitioningIssueId, setTransitioningIssueId] = useState<string | null>(null)
  const [transitionError, setTransitionError] = useState<string | null>(null)

  const { metadata: filterMetadata } = useBoardFilterMetadata(projectId, {
    enabled: boardReady,
  })

  const filters = useMemo(
    () => parseKanbanFiltersFromSearchParams(searchParams, filterMetadata),
    [searchParams, filterMetadata],
  )

  const {
    columns,
    loading: boardLoading,
    error: boardError,
    totalIssues,
    refreshBoard,
    loadMoreColumn,
    moveIssueBetweenColumns,
    rollbackIssueMove,
  } = useProjectKanban(projectId, {
    sprintId,
    enabled: boardReady && !isListView,
    filters,
    filterMetadata,
    searchParams,
  })

  const setFilters = useCallback(
    (next: KanbanBoardFilters) => {
      setSearchParams(
        (prev) => syncKanbanFiltersToSearchParams(next, prev),
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_KANBAN_FILTERS)
  }, [setFilters])

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
    filterMetadata,
    searchParams,
    setSearchParams,
  })

  const handleTransitionIssue = useCallback(
    async (issueId: string, targetStatusId: string, sourceStatusId: string) => {
      setTransitionError(null)
      setTransitioningIssueId(issueId)

      const sourceColumn = columns.find(
        (column) => (column.statusId ?? column.id) === sourceStatusId,
      )
      const movedIssue = sourceColumn?.issues.find((issue) => issue.id === issueId)
      if (!movedIssue) return

      moveIssueBetweenColumns(issueId, sourceStatusId, targetStatusId, movedIssue)

      try {
        const updated = await apiTransitionIssue(issueId, targetStatusId)
        const issue = mapIssueDetailToUi(updated, projectId)
        upsertApiIssue(issue)
        void syncProjectOpenIssueCount(projectId)
      } catch (err) {
        rollbackIssueMove(issueId, sourceStatusId, targetStatusId, movedIssue)
        const message =
          err instanceof ApiError ? err.message : 'Failed to transition issue.'
        setTransitionError(message)
      } finally {
        setTransitioningIssueId(null)
      }
    },
    [
      columns,
      moveIssueBetweenColumns,
      projectId,
      rollbackIssueMove,
    ],
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

    if (!sprint) {
      return <Navigate to={projectSprintsPath(projectId)} replace />
    }
  }

  const loading = isListView ? listLoading : boardLoading
  const error = isListView ? listError : boardError
  const showListEmpty =
    isListView && !listLoading && (listPagination?.totalCount ?? 0) === 0
  const emptyHint = sprintId
    ? 'Add issues to this sprint or adjust filters to see them here.'
    : 'Adjust assignee, status, priority, or label filters to see issues.'

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-devflow-surface">
      <BoardFilters
        filters={filters}
        filterMetadata={filterMetadata}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
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
          )
        ) : boardLoading && columns.length === 0 && totalIssues === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">
              {sprintId ? 'Loading sprint board…' : 'Loading board…'}
            </p>
          </div>
        ) : !boardLoading && totalIssues === 0 ? (
          <div className="issue-board-empty">
            <p className="issue-board-empty__title">No issues match filters</p>
            <p className="issue-board-empty__hint">{emptyHint}</p>
          </div>
        ) : (
          <KanbanBoardView
            key={`${projectId}:${sprintId ?? ''}:${JSON.stringify(filters)}`}
            columns={columns}
            onTransitionIssue={handleTransitionIssue}
            transitioningIssueId={transitioningIssueId}
            onLoadMoreColumn={loadMoreColumn}
          />
        )}
      </main>
    </div>
  )
}
