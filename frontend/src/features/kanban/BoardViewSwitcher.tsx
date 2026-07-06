import type { IssueViewMode } from '@/types/tasks'
import { cn } from '@/utils/cn'

type BoardViewSwitcherProps = {
  value: IssueViewMode
  onChange: (mode: IssueViewMode) => void
}

const VIEW_OPTIONS: { mode: IssueViewMode; label: string; icon: string }[] = [
  { mode: 'list', label: 'List view', icon: '☰' },
  { mode: 'board', label: 'Board view', icon: '▦' },
]

export function BoardViewSwitcher({ value, onChange }: BoardViewSwitcherProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-devflow-border bg-devflow-card p-0.5"
      role="group"
      aria-label="View mode"
    >
      {VIEW_OPTIONS.map(({ mode, label, icon }) => {
        const active = value === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={cn(
              'rounded-md border px-2 py-1 text-[15px] leading-none transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-devflow-primary/40 focus-visible:ring-offset-1',
              active
                ? 'border-devflow-border bg-devflow-surface text-devflow-text shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
                : 'border-transparent text-devflow-text-muted hover:bg-devflow-surface/60 hover:text-devflow-text-secondary',
            )}
          >
            <span aria-hidden>{icon}</span>
          </button>
        )
      })}
    </div>
  )
}
