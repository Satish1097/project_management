import { useDroppable } from '@dnd-kit/core'
import { MoreHorizontal, Plus } from 'lucide-react'
import type { KanbanColumn as KanbanColumnType } from '@/types/kanban'
import { TaskCard } from './TaskCard'
import { cn } from '@/utils/cn'

type KanbanColumnProps = {
  column: KanbanColumnType
  draggingIssueId?: string | null
  isDragActive?: boolean
  transitioningIssueId?: string | null
  draggable?: boolean
}

export function KanbanColumn({
  column,
  draggingIssueId = null,
  isDragActive = false,
  transitioningIssueId = null,
  draggable = true,
}: KanbanColumnProps) {
  const statusId = column.statusId ?? column.id
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  })

  const showDropIndicator = isOver && isDragActive

  return (
    <section
      className={cn(
        'issue-kanban-column group',
        isOver && isDragActive && 'issue-kanban-column--over',
      )}
    >
      <header className="issue-kanban-column__header">
        <div className="issue-kanban-column__header-title">
          <span
            className="issue-kanban-column__status-dot"
            style={{ backgroundColor: column.dotColor }}
            aria-hidden
          />
          <span className="issue-kanban-column__label">{column.title}</span>
          <span className="issue-kanban-column__separator" aria-hidden>
            •
          </span>
          <span
            className="issue-kanban-column__count"
            aria-label={`${column.count} issues`}
          >
            {column.count}
          </span>
        </div>
        <div className="issue-kanban-column__actions">
          <button
            type="button"
            className="text-devflow-text-muted lg:hidden"
            aria-label={`${column.title} column menu`}
          >
            <MoreHorizontal className="size-4" />
          </button>
          <button
            type="button"
            className="issue-kanban-column__add-btn"
            aria-label={`Add issue to ${column.title}`}
            title={`Add to ${column.title}`}
          >
            <Plus className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      </header>

      <div ref={setNodeRef} className="issue-kanban-column__body">
        {column.issues.length === 0 && !showDropIndicator ? (
          <div className="issue-kanban-empty">
            <p className="issue-kanban-empty__text">No issues in this column</p>
          </div>
        ) : (
          <>
            {column.issues.map((issue) => (
              <TaskCard
                key={issue.id}
                issue={issue}
                columnId={column.id}
                statusId={statusId}
                isDragging={draggingIssueId === issue.id}
                isTransitioning={transitioningIssueId === issue.id}
                draggable={draggable}
              />
            ))}
            {showDropIndicator ? (
              <div className="issue-drop-indicator" aria-hidden />
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
