import { useMemo } from 'react'
import { CalendarRange } from 'lucide-react'
import { InlineDropdown } from '@/components/issues/inline/InlineDropdown'
import { INLINE_CELL_TRIGGER } from '@/components/issues/backlogTableLayout'
import { getSprintsForProject } from '@/services/projectData'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import { cn } from '@/utils/cn'

type InlineSprintPickerProps = {
  projectId: string
  value: string | null
  onChange: (sprintId: string | null) => void
  disabled?: boolean
  compact?: boolean
  cell?: boolean
  className?: string
  includeBacklog?: boolean
}

export function InlineSprintPicker({
  projectId,
  value,
  onChange,
  disabled = false,
  compact = false,
  cell = false,
  className,
  includeBacklog = true,
}: InlineSprintPickerProps) {
  const sprints = useMemo(
    () =>
      getSprintsForProject(projectId).filter(
        (sprint) =>
          sprint.status === 'planned' ||
          sprint.status === 'active' ||
          sprint.id === value,
      ),
    [projectId, value],
  )

  const currentLabel = useMemo(() => {
    if (!value) return 'Backlog'
    return sprints.find((sprint) => sprint.id === value)?.name ?? 'Sprint'
  }, [sprints, value])

  const options = useMemo(() => {
    const items = sprints.map((sprint) => ({
      id: sprint.id,
      label: sprint.name,
      keywords: sprint.name,
      icon: <SprintStatusBadge status={sprint.status} />,
    }))

    if (includeBacklog) {
      return [
        {
          id: '__backlog__',
          label: 'Backlog',
          icon: <CalendarRange className="size-4 text-devflow-text-muted" />,
        },
        ...items,
      ]
    }

    return items
  }, [includeBacklog, sprints])

  return (
    <InlineDropdown
      className={className}
      disabled={disabled}
      fullWidth={cell}
      searchable
      searchPlaceholder="Search sprints…"
      options={options}
      onSelect={(optionId) => {
        onChange(optionId === '__backlog__' ? null : optionId)
      }}
      trigger={
        <span
          title={currentLabel}
          className={cn(
            cell
              ? INLINE_CELL_TRIGGER
              : 'inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-caption text-devflow-text-secondary hover:bg-devflow-muted/60',
            compact && !cell && 'px-1.5 py-0.5',
          )}
        >
          {!cell ? (
            <CalendarRange className="size-3.5 shrink-0 text-devflow-text-muted" />
          ) : null}
          <span className="min-w-0 truncate">{currentLabel}</span>
        </span>
      }
    />
  )
}
