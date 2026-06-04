import { Search } from 'lucide-react'
import type { SprintStatus } from '@/types/sprints'
import { cn } from '@/utils/cn'

export type SprintFilterStatus = SprintStatus | 'all'
export type SprintSortKey = 'date' | 'status' | 'name'

type SprintFiltersBarProps = {
  query: string
  onQueryChange: (q: string) => void
  status: SprintFilterStatus
  onStatusChange: (s: SprintFilterStatus) => void
  sort: SprintSortKey
  onSortChange: (s: SprintSortKey) => void
}

const statusFilters: { id: SprintFilterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'planned', label: 'Planned' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function SprintFiltersBar({
  query,
  onQueryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: SprintFiltersBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-devflow-text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search sprints…"
          className="w-full rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-9 pr-3 text-input text-devflow-text outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onStatusChange(f.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-caption transition-colors',
                status === f.id
                  ? 'bg-[var(--df-nav-tint)] font-medium text-devflow-primary'
                  : 'text-devflow-text-secondary hover:bg-devflow-muted',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SprintSortKey)}
          className="rounded-lg border border-devflow-border bg-devflow-surface px-2 py-1 text-caption text-devflow-text"
          aria-label="Sort sprints"
        >
          <option value="date">Sort by date</option>
          <option value="status">Sort by status</option>
          <option value="name">Sort by name</option>
        </select>
      </div>
    </div>
  )
}
