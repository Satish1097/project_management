import { KanbanColumn } from './KanbanColumn'
import { KanbanDndProvider } from './KanbanDndProvider'
import type { KanbanColumnWithPagination } from '@/features/kanban/useProjectKanban'
import '@/features/tasks/issues-board.css'

type KanbanBoardViewProps = {
  columns: KanbanColumnWithPagination[]
  onTransitionIssue?: (
    issueId: string,
    targetStatusId: string,
    sourceStatusId: string,
  ) => void | Promise<void>
  transitioningIssueId?: string | null
  enableDragDrop?: boolean
  showWipIndicators?: boolean
  emptyTitle?: string
  emptyHint?: string
  showSprintBadge?: boolean
  onLoadMoreColumn?: (statusId: string) => void
}

export function KanbanBoardView({
  columns,
  onTransitionIssue,
  transitioningIssueId = null,
  enableDragDrop = true,
  showWipIndicators = false,
  emptyTitle = 'No issues on the board',
  emptyHint = 'Create issues in the backlog to see them here.',
  showSprintBadge = false,
  onLoadMoreColumn,
}: KanbanBoardViewProps) {
  const totalIssues = columns.reduce((sum, column) => sum + column.count, 0)

  if (totalIssues === 0) {
    return (
      <div className="issue-board-empty">
        <p className="issue-board-empty__title">{emptyTitle}</p>
        <p className="issue-board-empty__hint">{emptyHint}</p>
      </div>
    )
  }

  if (!enableDragDrop || !onTransitionIssue) {
    return (
      <div
        className="issue-board-scroll"
        role="region"
        aria-label="Kanban board"
        tabIndex={0}
      >
        <div className="issue-board-track">
          {columns.map((column) => (
            <div key={column.id} className="w-72 shrink-0">
              <KanbanColumn
                column={column}
                draggable={false}
                showSprintBadge={showSprintBadge}
                showWipIndicators={showWipIndicators}
                onLoadMore={onLoadMoreColumn}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <KanbanDndProvider
      columns={columns}
      onTransitionIssue={onTransitionIssue}
      transitioningIssueId={transitioningIssueId}
      showSprintBadge={showSprintBadge}
    >
      {({ draggingIssueId, isDragActive }) => (
        <div
          className="issue-board-scroll"
          role="region"
          aria-label="Kanban board"
          tabIndex={0}
        >
          <div className="issue-board-track">
            {columns.map((column) => (
              <div key={column.id} className="w-72 shrink-0">
                <KanbanColumn
                  column={column}
                  draggingIssueId={draggingIssueId}
                  isDragActive={isDragActive}
                  transitioningIssueId={transitioningIssueId}
                  showSprintBadge={showSprintBadge}
                  showWipIndicators={showWipIndicators}
                  onLoadMore={onLoadMoreColumn}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </KanbanDndProvider>
  )
}
