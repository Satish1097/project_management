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
  onTransitionIssue: (
    issueId: string,
    targetStatusId: string,
    sourceStatusId: string,
  ) => void | Promise<void>
  transitioningIssueId: string | null
  showSprintBadge?: boolean
  children: (state: {
    draggingIssueId: string | null
    isDragActive: boolean
  }) => ReactNode
}

function findIssueInColumns(
  columns: KanbanColumn[],
  issueId: string,
): { issue: KanbanIssue; columnId: string; statusId: string } | null {
  for (const column of columns) {
    const issue = column.issues.find((item) => item.id === issueId)
    if (issue) {
      return { issue, columnId: column.id, statusId: column.statusId ?? column.id }
    }
  }
  return null
}

export function KanbanDndProvider({
  columns,
  onTransitionIssue,
  transitioningIssueId,
  showSprintBadge = false,
  children,
}: KanbanDndProviderProps) {
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null)
  const [activeIssue, setActiveIssue] = useState<{
    issue: KanbanIssue
    columnId: string
    statusId: string
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
      const sourceStatusId = String(event.active.data.current?.statusId ?? '')
      const overId = event.over?.id

      if (!overId || !sourceStatusId) return

      const targetStatusId = String(overId)
      if (sourceStatusId === targetStatusId) return

      void onTransitionIssue(issueId, targetStatusId, sourceStatusId)
    },
    [onTransitionIssue],
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
            statusId={activeIssue.statusId}
            isDragOverlay
            showSprintBadge={showSprintBadge}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
