import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'
import { BoardFilters } from '@/features/kanban/BoardFilters'
import {
  parseKanbanFiltersFromSearchParams,
  syncKanbanFiltersToSearchParams,
} from '@/features/kanban/boardFilterParams'
import { DEFAULT_KANBAN_FILTERS } from '@/features/kanban/kanbanFilters'
import { useBoardFilterMetadata } from '@/features/kanban/useBoardFilterMetadata'
import { useProjectIssueList } from '@/features/kanban/useProjectIssueList'
import { IssueListView } from '@/features/tasks/IssueListView'
import { getProjectById, getSprintById } from '@/services/projectData'
import type { KanbanBoardFilters } from '@/types/kanban'

export function SprintListPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)

  const { metadata: filterMetadata } = useBoardFilterMetadata(projectId, {
    enabled: !!project,
  })

  const filters = useMemo(
    () => parseKanbanFiltersFromSearchParams(searchParams, filterMetadata),
    [searchParams, filterMetadata],
  )

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

  const { tasks, loading, error, pagination, handlePageChange } = useProjectIssueList({
    project: project!,
    sprintId,
    enabled: !!project && !!sprintId,
    filters,
    filterMetadata,
    searchParams,
    setSearchParams,
  })

  if (!project || !sprint) {
    return <Navigate to="/projects" replace />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-devflow-surface">
      <BoardFilters
        filters={filters}
        filterMetadata={filterMetadata}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />
      <main className="page-main p-3">
        {error ? (
          <div className="rounded-lg border border-devflow-error/30 bg-devflow-error/5 px-4 py-3 text-body text-devflow-error">
            {error}
          </div>
        ) : null}
        {loading && tasks.length === 0 ? (
          <div className="rounded-lg border border-devflow-border bg-devflow-card px-4 py-3 text-body text-devflow-text-secondary">
            Loading sprint issues…
          </div>
        ) : (
          <IssueListView
            tasks={tasks}
            pagination={
              pagination
                ? {
                    ...pagination,
                    onPageChange: handlePageChange,
                  }
                : null
            }
          />
        )}
      </main>
    </div>
  )
}
