import { useState, type CSSProperties } from 'react'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '@/types/tasks'
import type { WorkflowColumn } from './issueWorkflow'
import { IssueCard } from './IssueCard'
import { cn } from '@/utils/cn'

type KanbanColumnProps = {
  column: WorkflowColumn
  tasks: Task[]
  draggingTaskId: string | null
  onDragStart: (taskId: string) => void
  onDragEnd: () => void
  onDrop: (status: TaskStatus, taskId: string) => void
}

export function KanbanColumn({
  column,
  tasks,
  draggingTaskId,
  onDragStart,
  onDragEnd,
  onDrop,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false)
  const isDragActive = draggingTaskId !== null
  const showDropIndicator = isOver && isDragActive

  return (
    <section
      className={cn(
        'issue-kanban-column group',
        isOver && isDragActive && 'issue-kanban-column--over',
      )}
      style={
        {
          '--column-accent': column.accent,
        } as CSSProperties
      }
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsOver(true)
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsOver(false)
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        const taskId = e.dataTransfer.getData('text/task-id')
        if (taskId) {
          onDrop(column.id, taskId)
        }
      }}
    >
      <header className="issue-kanban-column__header">
        <div className="issue-kanban-column__header-title">
          <span
            className="issue-kanban-column__status-dot"
            style={{ backgroundColor: column.dotColor }}
            aria-hidden
          />
          <span className="issue-kanban-column__label">{column.headerLabel}</span>
          <span className="issue-kanban-column__separator" aria-hidden>
            •
          </span>
          <span
            className="issue-kanban-column__count"
            aria-label={`${tasks.length} issues`}
          >
            {tasks.length}
          </span>
        </div>
        <div className="issue-kanban-column__actions">
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
        {tasks.length === 0 && !showDropIndicator ? (
          <div className="issue-kanban-empty">
            <p className="issue-kanban-empty__text">{column.emptyMessage}</p>
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <IssueCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggingTaskId === task.id}
              />
            ))}
            {showDropIndicator && <div className="issue-drop-indicator" aria-hidden />}
          </>
        )}
      </div>
    </section>
  )
}
