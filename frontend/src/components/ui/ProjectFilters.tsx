import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ProjectFilterId =
  | 'all'
  | 'mine'
  | 'active'
  | 'planning'
  | 'archived'
  | 'favorites'

export type ProjectViewMode = 'grid' | 'list'

const filters: { id: ProjectFilterId; label: string }[] = [
  { id: 'all', label: 'All Projects' },
  { id: 'mine', label: 'My Projects' },
  { id: 'active', label: 'Active' },
  { id: 'planning', label: 'Planning' },
  { id: 'archived', label: 'Archived' },
  { id: 'favorites', label: 'Favorites' },
]

type ProjectFiltersProps = {
  activeFilter: ProjectFilterId
  onFilterChange: (filter: ProjectFilterId) => void
  viewMode: ProjectViewMode
  onViewModeChange: (mode: ProjectViewMode) => void
  resultCount: number
}

export function ProjectFilters({
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
  resultCount,
}: ProjectFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onFilterChange(id)}
            className={cn(
              'rounded-md px-2.5 py-1 text-nav transition-colors',
              activeFilter === id
                ? 'bg-[var(--df-nav-tint)] font-medium text-devflow-primary'
                : 'text-devflow-text-secondary hover:bg-devflow-muted hover:text-devflow-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="text-caption text-devflow-text-muted">
          {resultCount} {resultCount === 1 ? 'project' : 'projects'}
        </span>
        <div
          className="flex rounded-md border border-devflow-border p-0.5"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            aria-pressed={viewMode === 'grid'}
            className={cn(
              'rounded p-1 transition-colors',
              viewMode === 'grid'
                ? 'bg-devflow-muted text-devflow-text'
                : 'text-devflow-text-muted hover:text-devflow-text-secondary',
            )}
          >
            <LayoutGrid className="size-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            aria-pressed={viewMode === 'list'}
            className={cn(
              'rounded p-1 transition-colors',
              viewMode === 'list'
                ? 'bg-devflow-muted text-devflow-text'
                : 'text-devflow-text-muted hover:text-devflow-text-secondary',
            )}
          >
            <List className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  )
}
