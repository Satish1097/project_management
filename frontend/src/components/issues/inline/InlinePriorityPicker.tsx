import { InlineDropdown } from '@/components/issues/inline/InlineDropdown'
import { INLINE_CELL_TRIGGER } from '@/components/issues/backlogTableLayout'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import { ISSUE_PRIORITY_OPTIONS } from '@/constants/issueOptions'
import type { IssuePriorityLevel } from '@/types/issues'
import { mapPriorityLevelToKanban } from '@/types/issues'
import { cn } from '@/utils/cn'

type InlinePriorityPickerProps = {
  value: IssuePriorityLevel
  onChange: (value: IssuePriorityLevel) => void
  disabled?: boolean
  compact?: boolean
  cell?: boolean
  className?: string
}

export function InlinePriorityPicker({
  value,
  onChange,
  disabled = false,
  compact = false,
  cell = false,
  className,
}: InlinePriorityPickerProps) {
  const priorityLabel =
    ISSUE_PRIORITY_OPTIONS.find((option) => option.value === value)?.label ?? value

  const options = ISSUE_PRIORITY_OPTIONS.map((option) => ({
    id: option.value,
    label: option.label,
    icon: (
      <PriorityIndicator
        priority={mapPriorityLevelToKanban(option.value) ?? 'medium'}
      />
    ),
  }))

  return (
    <InlineDropdown
      className={className}
      disabled={disabled}
      fullWidth={cell}
      options={options}
      onSelect={(optionId) => onChange(optionId as IssuePriorityLevel)}
      trigger={
        <span
          title={priorityLabel}
          className={cn(
            cell
              ? cn(INLINE_CELL_TRIGGER, 'gap-1.5')
              : compact
                ? 'inline-flex rounded-md p-1 hover:bg-devflow-muted/60'
                : 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-devflow-muted/60',
          )}
        >
          <PriorityIndicator priority={mapPriorityLevelToKanban(value) ?? 'medium'} />
          {cell || !compact ? (
            <span className="min-w-0 truncate text-caption text-devflow-text-secondary">
              {priorityLabel}
            </span>
          ) : null}
        </span>
      }
    />
  )
}
