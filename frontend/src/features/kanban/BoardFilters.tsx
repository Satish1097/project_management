import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { UserAvatar } from '@/components/ui/UserAvatar'
import {
  DEFAULT_KANBAN_FILTERS,
  hasActiveKanbanFilters,
} from '@/features/kanban/kanbanFilters'
import type { KanbanBoardFilterMetadata, KanbanBoardFilters, KanbanPriorityFilter } from '@/types/kanban'
import { cn } from '@/utils/cn'

type BoardFiltersProps = {
  advancedBoardPath?: string
  filters?: KanbanBoardFilters
  filterMetadata?: KanbanBoardFilterMetadata | null
  onFiltersChange?: (filters: KanbanBoardFilters) => void
  onClearFilters?: () => void
}

type OpenMenu = 'assignee' | 'status' | 'priority' | 'label' | null

const avatarColors = ['#6366f1', '#ec4899', '#f59e0b', '#94a3b8']

export function BoardFilters({
  advancedBoardPath,
  filters: filtersProp,
  filterMetadata = null,
  onFiltersChange,
  onClearFilters,
}: BoardFiltersProps) {
  const [localFilters, setLocalFilters] = useState<KanbanBoardFilters>(
    DEFAULT_KANBAN_FILTERS,
  )
  const filters = filtersProp ?? localFilters
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const { projectId = '' } = useParams()

  const assigneeOptions = filterMetadata?.assignees ?? []
  const statusOptions = filterMetadata?.statuses ?? []
  const priorityOptions = filterMetadata?.priorities ?? []
  const labelOptions = filterMetadata?.labels ?? []

  const updateFilters = (next: KanbanBoardFilters) => {
    if (onFiltersChange) {
      onFiltersChange(next)
      return
    }
    setLocalFilters(next)
  }

  const resetFilters = () => {
    if (onClearFilters) {
      onClearFilters()
      return
    }
    setLocalFilters(DEFAULT_KANBAN_FILTERS)
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!barRef.current?.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const memberAssignees = assigneeOptions.filter(
    (assignee) => assignee.id !== 'unassigned' && assignee.id !== 'all',
  )
  const previewAssignees = memberAssignees.slice(0, 3)
  const extraAssigneeCount = Math.max(memberAssignees.length - 3, 0)
  const filtersActive = hasActiveKanbanFilters(filters)

  const assigneeLabel =
    filters.assigneeId === 'all'
      ? 'Assignee'
      : assigneeOptions.find((assignee) => assignee.id === filters.assigneeId)
          ?.display_name ?? 'Assignee'

  const statusLabel =
    filters.statusId === 'all'
      ? 'Status'
      : statusOptions.find((status) => status.id === filters.statusId)?.name ?? 'Status'

  const priorityLabel =
    priorityOptions.find((option) => option.id === filters.priority)?.label ?? 'Priority'

  const labelSummary =
    filters.labels.length === 0
      ? 'Label'
      : filters.labels.length === 1
        ? labelOptions.find((label) => label.id === filters.labels[0])?.name ??
          'Label'
        : `${filters.labels.length} labels`

  return (
    <div
      ref={barRef}
      className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-devflow-border filter-bar-glass px-4 py-2"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <div className="flex items-center">
          {previewAssignees.map((assignee, index) => (
            <UserAvatar
              key={assignee.id}
              name={assignee.display_name}
              color={avatarColors[index] ?? '#94a3b8'}
              size={28}
              userId={assignee.id}
              projectId={projectId}
              className={cnAvatarOverlap(index)}
            />
          ))}
          {extraAssigneeCount > 0 ? (
            <div className="-ml-2 flex size-7 items-center justify-center rounded-full border-2 border-devflow-surface bg-devflow-pill text-caption font-medium text-devflow-text-secondary">
              +{extraAssigneeCount}
            </div>
          ) : null}
        </div>
        <span className="hidden h-4 w-px bg-devflow-border sm:block" />
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterMenu
            label={assigneeLabel}
            isOpen={openMenu === 'assignee'}
            isActive={filters.assigneeId !== 'all'}
            onToggle={() =>
              setOpenMenu((current) => (current === 'assignee' ? null : 'assignee'))
            }
          >
            {assigneeOptions.map((assignee) => (
              <FilterOption
                key={assignee.id}
                selected={filters.assigneeId === assignee.id}
                onSelect={() => {
                  updateFilters({ ...filters, assigneeId: assignee.id })
                  setOpenMenu(null)
                }}
              >
                {assignee.display_name}
              </FilterOption>
            ))}
          </FilterMenu>

          <FilterMenu
            label={statusLabel}
            isOpen={openMenu === 'status'}
            isActive={filters.statusId !== 'all'}
            onToggle={() =>
              setOpenMenu((current) => (current === 'status' ? null : 'status'))
            }
          >
            {statusOptions.map((status) => (
              <FilterOption
                key={status.id}
                selected={filters.statusId === status.id}
                onSelect={() => {
                  updateFilters({ ...filters, statusId: status.id })
                  setOpenMenu(null)
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {status.color ? (
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                  ) : null}
                  {status.name}
                </span>
              </FilterOption>
            ))}
          </FilterMenu>

          <FilterMenu
            label={priorityLabel}
            isOpen={openMenu === 'priority'}
            isActive={filters.priority !== 'all'}
            onToggle={() =>
              setOpenMenu((current) => (current === 'priority' ? null : 'priority'))
            }
          >
            {priorityOptions.map((option) => (
              <FilterOption
                key={option.id}
                selected={filters.priority === option.id}
                onSelect={() => {
                  updateFilters({
                    ...filters,
                    priority: option.id as KanbanPriorityFilter,
                  })
                  setOpenMenu(null)
                }}
              >
                {option.label}
              </FilterOption>
            ))}
          </FilterMenu>

          <FilterMenu
            label={labelSummary}
            isOpen={openMenu === 'label'}
            isActive={filters.labels.length > 0}
            onToggle={() =>
              setOpenMenu((current) => (current === 'label' ? null : 'label'))
            }
          >
            {labelOptions.map((label) => {
              const selected = filters.labels.includes(label.id)
              return (
                <label
                  key={label.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-caption text-devflow-text hover:bg-devflow-muted"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const nextLabels = selected
                        ? filters.labels.filter((item) => item !== label.id)
                        : [...filters.labels, label.id]
                      updateFilters({ ...filters, labels: nextLabels })
                    }}
                    className="size-3.5 rounded border-devflow-border text-devflow-primary"
                  />
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </span>
                </label>
              )
            })}
          </FilterMenu>

          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                resetFilters()
                setOpenMenu(null)
              }}
              className="px-1 text-caption text-devflow-primary hover:underline"
            >
              Clear filters
            </button>
          ) : null}
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

type FilterMenuProps = {
  label: string
  isOpen: boolean
  isActive: boolean
  onToggle: () => void
  children: React.ReactNode
}

function FilterMenu({
  label,
  isOpen,
  isActive,
  onToggle,
  children,
}: FilterMenuProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-caption capitalize',
          isActive
            ? 'border-devflow-primary/40 bg-[var(--df-nav-tint)] text-devflow-primary'
            : 'border-devflow-border bg-devflow-card text-devflow-text-secondary',
        )}
      >
        {label}
        <ChevronDown className="size-2.5 text-devflow-text-muted" />
      </button>
      {isOpen ? (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-[9rem] rounded-lg border border-devflow-border bg-devflow-card p-1 shadow-devflow-md">
          {children}
        </div>
      ) : null}
    </div>
  )
}

type FilterOptionProps = {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
}

function FilterOption({ selected, onSelect, children }: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center rounded-md px-2 py-1.5 text-left text-caption capitalize',
        selected
          ? 'bg-[var(--df-nav-tint)] font-medium text-devflow-primary'
          : 'text-devflow-text-secondary hover:bg-devflow-muted',
      )}
    >
      {children}
    </button>
  )
}

function cnAvatarOverlap(index: number) {
  return index > 0 ? '-ml-2 border-2 border-devflow-surface' : 'border-2 border-devflow-surface'
}
