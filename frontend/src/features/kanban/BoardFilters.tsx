import { ChevronDown, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { boardFilters } from '@/services/mockKanban'

const filterChips = ['Assignee', 'Priority', 'Label'] as const

const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#94a3b8']

export function BoardFilters() {
  return (
    <div className="flex items-center justify-between border-b border-devflow-border bg-[rgba(247,249,251,0.5)] px-4 py-3 backdrop-blur-[2px]">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          {boardFilters.assignees.slice(0, 3).map((name, i) => (
            <Avatar
              key={name}
              name={name}
              color={avatarColors[i] ?? '#94a3b8'}
              size={32}
              className={cnAvatarOverlap(i)}
            />
          ))}
          <div className="-ml-2 flex size-8 items-center justify-center rounded-full border-2 border-devflow-surface bg-[#e6e8ea] text-caption font-semibold text-devflow-text-secondary">
            +4
          </div>
        </div>
        <span className="h-6 w-px bg-devflow-border" />
        <div className="flex items-center gap-2">
          {filterChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-devflow-border bg-white px-[9px] py-[5px] text-body text-devflow-text-secondary"
            >
              {chip}
              <ChevronDown className="size-2 text-devflow-text-muted" />
            </button>
          ))}
          <button
            type="button"
            className="pl-2 text-nav text-devflow-primary"
          >
            Clear filters
          </button>
        </div>
      </div>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-6 py-2 text-btn text-white shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]"
      >
        <Plus className="size-5" strokeWidth={2} />
        Create Issue
      </button>
    </div>
  )
}

function cnAvatarOverlap(index: number) {
  return index > 0 ? '-ml-2 border-2 border-devflow-surface' : 'border-2 border-devflow-surface'
}
