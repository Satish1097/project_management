import { useCallback, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { TaskCard } from '@/features/kanban/TaskCard'
import type { KanbanColumn, KanbanIssue } from '@/types/kanban'

type KanbanDndProviderProps = {
  columns: KanbanColumn[]
  onMoveIssue: (
    issueId: string,
    targetColumnId: string,
    sourceColumnId: string,
  ) => void | Promise<void>
  transitioningIssueId: string | null
  children: (state: {
    draggingIssueId: string | null
    isDragActive: boolean
  }) => ReactNode
}

function findIssueInColumns(
  columns: KanbanColumn[],
  issueId: string,
): { issue: KanbanIssue; columnId: string } | null {
  for (const column of columns) {
    const issue = column.issues.find((item) => item.id === issueId)
    if (issue) {
      return { issue, columnId: column.id }
    }
  }
  return null
}

export function KanbanDndProvider({
  columns,
  onMoveIssue,
  transitioningIssueId,
  children,
}: KanbanDndProviderProps) {
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null)
  const [activeIssue, setActiveIssue] = useState<{
    issue: KanbanIssue
    columnId: string
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (transitioningIssueId) return

      const issueId = String(event.active.id)
      const located = findIssueInColumns(columns, issueId)
      if (!located) return

      setDraggingIssueId(issueId)
      setActiveIssue(located)
    },
    [columns, transitioningIssueId],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingIssueId(null)
      setActiveIssue(null)

      const issueId = String(event.active.id)
      const sourceColumnId = String(event.active.data.current?.columnId ?? '')
      const overId = event.over?.id

      if (!overId || !sourceColumnId) return

      const targetColumnId = String(overId)
      if (sourceColumnId === targetColumnId) return

      void onMoveIssue(issueId, targetColumnId, sourceColumnId)
    },
    [onMoveIssue],
  )

  const handleDragCancel = useCallback(() => {
    setDraggingIssueId(null)
    setActiveIssue(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {children({
        draggingIssueId,
        isDragActive: draggingIssueId !== null,
      })}
      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <TaskCard
            issue={activeIssue.issue}
            columnId={activeIssue.columnId}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
