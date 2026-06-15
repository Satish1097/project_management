import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { IssueFilters, TaskPriority, TaskStatus } from '@/types/tasks'
import { cn } from '@/utils/cn'

type FilterMenuProps<T extends string> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

function FilterMenu<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterMenuProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = value !== 'all'
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-body',
          active
            ? 'bg-[var(--df-brand-tint)] font-medium text-devflow-brand'
            : 'bg-devflow-muted text-devflow-text',
        )}
      >
        {active && selected ? selected.label : label}
        <ChevronDown className="size-2 text-devflow-text-secondary" />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-devflow-border bg-devflow-card py-1 shadow-devflow-md"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  'w-full px-3 py-2 text-left text-body hover:bg-devflow-muted',
                  value === opt.value && 'font-semibold text-devflow-brand',
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const statusOptions: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'testing', label: 'Testing / QA' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'done', label: 'Done' },
]

const priorityOptions: { value: TaskPriority | 'all'; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
]

type IssueFilterMenusProps = {
  filters: IssueFilters
  projects: readonly string[]
  onFilterChange: <K extends keyof IssueFilters>(
    key: K,
    value: IssueFilters[K],
  ) => void
}

export function IssueFilterMenus({
  filters,
  projects,
  onFilterChange,
}: IssueFilterMenusProps) {
  const projectOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'All projects' },
    ...projects.map((p) => ({ value: p, label: p })),
  ]

  return (
    <>
      <FilterMenu
        label="Status"
        value={filters.status}
        options={statusOptions}
        onChange={(v) => onFilterChange('status', v)}
      />
      <FilterMenu
        label="Priority"
        value={filters.priority}
        options={priorityOptions}
        onChange={(v) => onFilterChange('priority', v)}
      />
      <FilterMenu
        label="Project"
        value={filters.project}
        options={projectOptions}
        onChange={(v) => onFilterChange('project', v)}
      />
    </>
  )
}
