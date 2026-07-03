import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/utils/cn'

const VIRTUALIZE_THRESHOLD = 15
const ESTIMATED_ROW_HEIGHT = 72

type VirtualizedIssueListProps = {
  items: string[]
  renderItem: (id: string, index: number) => ReactNode
  className?: string
  maxHeight?: number
}

export function VirtualizedIssueList({
  items,
  renderItem,
  className,
  maxHeight = 480,
}: VirtualizedIssueListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 6,
  })

  if (items.length <= VIRTUALIZE_THRESHOLD) {
    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {items.map((id, index) => (
          <div key={id}>{renderItem(id, index)}</div>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={cn('overflow-y-auto', className)}
      style={{ maxHeight }}
    >
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
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="pb-1.5">{renderItem(id, virtualRow.index)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
