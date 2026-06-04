import { MoreHorizontal, Plus } from 'lucide-react'
import type { KanbanColumn as KanbanColumnType } from '@/types/kanban'
import { TaskCard } from './TaskCard'

type KanbanColumnProps = {
  column: KanbanColumnType
}

export function KanbanColumn({ column }: KanbanColumnProps) {
  return (
    <section className="issue-kanban-column group">
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

      <div className="issue-kanban-column__body">
        {column.issues.length === 0 ? (
          <div className="issue-kanban-empty">
            <p className="issue-kanban-empty__text">No issues in this column</p>
          </div>
        ) : (
          column.issues.map((issue) => (
            <TaskCard
              key={issue.id}
              issue={issue}
              columnId={column.id}
            />
          ))
        )}
      </div>
    </section>
  )
}
