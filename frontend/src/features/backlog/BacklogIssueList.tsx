import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/utils/cn'

const VIRTUALIZE_THRESHOLD = 15
const ESTIMATED_ROW_HEIGHT = 44

type BacklogIssueListProps = {
  items: string[]
  renderItem: (id: string, index: number) => ReactNode
  className?: string
  hasNext?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

export function BacklogIssueList({
  items,
  renderItem,
  className,
  hasNext = false,
  loadingMore = false,
  onLoadMore,
}: BacklogIssueListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const scrollMarginRef = useRef(0)

  useEffect(() => {
    if (!listRef.current) return
    scrollMarginRef.current = listRef.current.offsetTop
  }, [items.length])

  const handleLoadMore = useCallback(() => {
    if (!onLoadMore || !hasNext || loadingMore) return
    onLoadMore()
  }, [hasNext, loadingMore, onLoadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !onLoadMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMore()
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleLoadMore, onLoadMore, items.length, hasNext])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => document.documentElement,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    scrollMargin: scrollMarginRef.current,
    enabled: items.length > VIRTUALIZE_THRESHOLD,
  })

  const loadMoreSentinel =
    hasNext || loadingMore ? (
      <div
        ref={sentinelRef}
        className="flex min-h-8 items-center justify-center py-2 text-[12px] text-devflow-text-muted"
        aria-hidden={!loadingMore}
      >
        {loadingMore ? 'Loading more…' : null}
      </div>
    ) : null

  if (items.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div ref={listRef} className={cn('min-w-0', className)}>
        {items.map((id, index) => (
          <div key={id}>{renderItem(id, index)}</div>
        ))}
        {loadMoreSentinel}
      </div>
    )
  }

  return (
    <div ref={listRef} className={cn('relative min-w-0', className)}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const id = items[virtualRow.index]
          return (
            <div
              key={id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start - scrollMarginRef.current}px)`,
              }}
            >
              {renderItem(id, virtualRow.index)}
            </div>
          )
        })}
      </div>
      {loadMoreSentinel}
    </div>
  )
}
