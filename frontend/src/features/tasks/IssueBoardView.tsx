import { useCallback, useState } from 'react'
import type { Task, TaskStatus } from '@/types/tasks'
import { getWorkflowColumns, type WorkflowColumn } from './issueWorkflow'
import { KanbanColumn } from './KanbanColumn'

type IssueBoardViewProps = {
  tasksByStatus: Record<TaskStatus, Task[]>
  onMoveTask: (taskId: string, status: TaskStatus) => void
  columns?: WorkflowColumn[]
  emptyTitle?: string
  emptyHint?: string
}

export function IssueBoardView({
  tasksByStatus,
  onMoveTask,
  columns: columnsProp,
  emptyTitle = 'No issues on the board',
  emptyHint = 'Adjust filters or switch assignee tabs to see tasks here.',
}: IssueBoardViewProps) {
  const columns = columnsProp ?? getWorkflowColumns()
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)

  const handleDragStart = useCallback((taskId: string) => {
    setDraggingTaskId(taskId)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null)
  }, [])

  const handleDrop = useCallback(
    (status: TaskStatus, taskId: string) => {
      onMoveTask(taskId, status)
      setDraggingTaskId(null)
    },
    [onMoveTask],
  )

  const totalVisible = columns.reduce(
    (sum, col) => sum + (tasksByStatus[col.id]?.length ?? 0),
    0,
  )

  if (totalVisible === 0) {
    return (
      <div className="issue-board-empty">
        <p className="issue-board-empty__title">{emptyTitle}</p>
        <p className="issue-board-empty__hint">{emptyHint}</p>
      </div>
    )
  }

  return (
    <div
      className="issue-board-scroll"
      role="region"
      aria-label="Kanban board"
      tabIndex={0}
    >
      <div className="issue-board-track">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] ?? []}
            draggingTaskId={draggingTaskId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  )
}
