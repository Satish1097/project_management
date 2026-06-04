import { MoreHorizontal } from 'lucide-react'
import type { KanbanColumn as KanbanColumnType } from '@/types/kanban'
import { TaskCard } from './TaskCard'

type KanbanColumnProps = {
  column: KanbanColumnType
  projectId?: string
  sprintId?: string
}

export function KanbanColumn({
  column,
  projectId,
  sprintId,
}: KanbanColumnProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: column.dotColor }}
          />
          <h2 className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
            {column.title}
          </h2>
          <span className="rounded-full bg-devflow-pill px-2 py-0.5 text-caption-label leading-4 text-devflow-text-secondary">
            {column.count}
          </span>
        </div>
        <button
          type="button"
          className="text-devflow-text-muted"
          aria-label={`${column.title} column menu`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {column.issues.map((issue) => (
          <TaskCard
            key={issue.id}
            issue={issue}
            columnId={column.id}
            projectId={projectId}
            sprintId={sprintId}
          />
        ))}
      </div>
    </section>
  )
}
