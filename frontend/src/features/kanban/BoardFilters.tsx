import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { boardFilters } from '@/services/mockKanban'

const filterChips = ['Assignee', 'Priority', 'Label'] as const

const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#94a3b8']

type BoardFiltersProps = {
  advancedBoardPath?: string
}

export function BoardFilters({ advancedBoardPath }: BoardFiltersProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-devflow-border filter-bar-glass px-4 py-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
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
          <div className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-devflow-surface bg-devflow-pill text-caption font-medium text-devflow-text-secondary">
            +4
          </div>
        </div>
        <span className="hidden h-4 w-px bg-devflow-border sm:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          {filterChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-md border border-devflow-border bg-devflow-card px-2 text-caption text-devflow-text-secondary"
            >
              {chip}
              <ChevronDown className="size-2.5 text-devflow-text-muted" />
            </button>
          ))}
          <button
            type="button"
            className="px-1 text-caption text-devflow-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      </div>

      {advancedBoardPath ? (
        <Link
          to={advancedBoardPath}
          className="shrink-0 text-caption text-devflow-text-secondary transition-colors hover:text-devflow-primary"
        >
          Advanced board
        </Link>
      ) : null}
    </div>
  )
}

function cnAvatarOverlap(index: number) {
  return index > 0 ? '-ml-2 border-2 border-devflow-surface' : 'border-2 border-devflow-surface'
}
