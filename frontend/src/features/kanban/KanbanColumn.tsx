import { useCallback, useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AlertTriangle, MoreHorizontal, Plus } from 'lucide-react'
import type { KanbanColumnWithPagination } from '@/features/kanban/useProjectKanban'
import { TaskCard } from './TaskCard'
import { cn } from '@/utils/cn'

type KanbanColumnProps = {
  column: KanbanColumnWithPagination
  draggingIssueId?: string | null
  isDragActive?: boolean
  transitioningIssueId?: string | null
  draggable?: boolean
  showSprintBadge?: boolean
  showWipIndicators?: boolean
  onLoadMore?: (statusId: string) => void
}

function formatColumnCount(column: KanbanColumnWithPagination, showWipIndicators: boolean) {
  if (!showWipIndicators || column.wipLimit == null) {
    return String(column.count)
  }
  const wipValue = column.wipCount ?? column.count
  return `${wipValue} / ${column.wipLimit}`
}

function isWipExceeded(column: KanbanColumnWithPagination, showWipIndicators: boolean) {
  if (!showWipIndicators || column.wipLimit == null) return false
  const wipValue = column.wipCount ?? column.count
  return wipValue > column.wipLimit
}

export function KanbanColumn({
  column,
  draggingIssueId = null,
  isDragActive = false,
  transitioningIssueId = null,
  draggable = true,
  showSprintBadge = false,
  showWipIndicators = false,
  onLoadMore,
}: KanbanColumnProps) {
  const statusId = column.statusId ?? column.id
  const { setNodeRef, isOver } = useDroppable({
    id: statusId,
  })

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const showDropIndicator = isOver && isDragActive
  const pagination = column.pagination
  const hasNext = pagination?.hasNext ?? false
  const loadingMore = pagination?.loading ?? false
  const countLabel = formatColumnCount(column, showWipIndicators)
  const wipExceeded = isWipExceeded(column, showWipIndicators)

  const handleLoadMore = useCallback(() => {
    if (!onLoadMore || !hasNext || loadingMore) return
    onLoadMore(statusId)
  }, [hasNext, loadingMore, onLoadMore, statusId])

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel || !onLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore()
        }
      },
      { root, rootMargin: '120px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleLoadMore, onLoadMore])

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
            className={cn(
              'issue-kanban-column__count',
              showWipIndicators && column.wipLimit != null && 'issue-kanban-column__count--wip',
              wipExceeded && 'issue-kanban-column__count--wip-exceeded',
            )}
            aria-label={
              showWipIndicators && column.wipLimit != null
                ? `${countLabel} issues, WIP limit ${column.wipLimit}`
                : `${column.count} issues`
            }
          >
            {countLabel}
          </span>
          {wipExceeded ? (
            <span
              className="issue-kanban-column__wip-warning"
              title="WIP limit exceeded"
              aria-label="WIP limit exceeded"
            >
              <AlertTriangle className="size-3.5" strokeWidth={2} />
            </span>
          ) : null}
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

      <div
        ref={(node) => {
          setNodeRef(node)
          scrollRef.current = node
        }}
        className="issue-kanban-column__body"
      >
        {column.issues.length === 0 && !showDropIndicator && !loadingMore ? (
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
                showSprintBadge={showSprintBadge}
              />
            ))}
            {showDropIndicator ? (
              <div className="issue-drop-indicator" aria-hidden />
            ) : null}
            {hasNext ? (
              <div
                ref={sentinelRef}
                className="flex min-h-8 items-center justify-center py-2 text-caption text-devflow-text-muted"
                aria-hidden={!loadingMore}
              >
                {loadingMore ? 'Loading more…' : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
