import { ChevronDown, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { boardFilters } from '@/services/mockKanban'

const filterChips = ['Assignee', 'Priority', 'Label'] as const

const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#94a3b8']

type BoardFiltersProps = {
  onCreateIssue?: () => void
}

export function BoardFilters({ onCreateIssue }: BoardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-devflow-border filter-bar-glass px-4 py-2 backdrop-blur-[2px]">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="flex items-center">
          {boardFilters.assignees.slice(0, 3).map((name, i) => (
            <Avatar
              key={name}
              name={name}
              color={avatarColors[i] ?? '#94a3b8'}
              size={28}
              className={cnAvatarOverlap(i)}
            />
          ))}
          <div className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-devflow-surface bg-devflow-pill text-caption font-semibold text-devflow-text-secondary">
            +4
          </div>
        </div>
        <span className="hidden h-5 w-px bg-devflow-border sm:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          {filterChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-devflow-border bg-devflow-card px-2 py-1 text-body text-devflow-text-secondary"
            >
              {chip}
              <ChevronDown className="size-2.5 text-devflow-text-muted" />
            </button>
          ))}
          <button
            type="button"
            className="px-1.5 text-nav text-devflow-primary"
          >
            Clear filters
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onCreateIssue}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-devflow-primary px-4 py-1.5 text-btn text-white shadow-devflow-sm"
      >
        <Plus className="size-4" strokeWidth={2} />
        Create Issue
      </button>
    </div>
  )
}

function cnAvatarOverlap(index: number) {
  return index > 0 ? '-ml-2 border-2 border-devflow-surface' : 'border-2 border-devflow-surface'
}
