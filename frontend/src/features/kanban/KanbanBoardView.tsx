import { KanbanColumn } from './KanbanColumn'
import { KanbanDndProvider } from './KanbanDndProvider'
import type { KanbanColumn as KanbanColumnType } from '@/types/kanban'
import '@/features/tasks/issues-board.css'

type KanbanBoardViewProps = {
  columns: KanbanColumnType[]
  onMoveIssue: (
    issueId: string,
    targetColumnId: string,
    sourceColumnId: string,
  ) => void | Promise<void>
  transitioningIssueId: string | null
  emptyTitle?: string
  emptyHint?: string
}

export function KanbanBoardView({
  columns,
  onMoveIssue,
  transitioningIssueId,
  emptyTitle = 'No issues on the board',
  emptyHint = 'Create issues in the backlog to see them here.',
}: KanbanBoardViewProps) {
  const totalIssues = columns.reduce((sum, column) => sum + column.issues.length, 0)

  if (totalIssues === 0) {
    return (
      <div className="issue-board-empty">
        <p className="issue-board-empty__title">{emptyTitle}</p>
        <p className="issue-board-empty__hint">{emptyHint}</p>
      </div>
    )
  }

  return (
    <KanbanDndProvider
      columns={columns}
      onMoveIssue={onMoveIssue}
      transitioningIssueId={transitioningIssueId}
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
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </KanbanDndProvider>
  )
}
