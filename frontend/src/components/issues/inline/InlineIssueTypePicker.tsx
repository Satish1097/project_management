import {
  BookOpen,
  Bug,
  CheckSquare,
  GitBranch,
  Layers,
  Lightbulb,
  Sparkles,
} from 'lucide-react'
import { InlineDropdown } from '@/components/issues/inline/InlineDropdown'
import { INLINE_CELL_TRIGGER } from '@/components/issues/backlogTableLayout'
import { ISSUE_TYPE_OPTIONS } from '@/constants/issueOptions'
import type { IssueType } from '@/types/issues'
import { cn } from '@/utils/cn'

const icons: Record<IssueType, typeof CheckSquare> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  epic: Layers,
  improvement: Lightbulb,
  subtask: GitBranch,
  spike: Sparkles,
}

type InlineIssueTypePickerProps = {
  value: IssueType
  onChange: (value: IssueType) => void
  disabled?: boolean
  compact?: boolean
  className?: string
}

export function InlineIssueTypePicker({
  value,
  onChange,
  disabled = false,
  compact = false,
  className,
}: InlineIssueTypePickerProps) {
  const typeLabel =
    ISSUE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value
  const Icon = icons[value]

  const options = ISSUE_TYPE_OPTIONS.map((option) => {
    const OptionIcon = icons[option.value]
    return {
      id: option.value,
      label: option.label,
      icon: <OptionIcon className="size-3.5 shrink-0" strokeWidth={2} />,
    }
  })

  return (
    <InlineDropdown
      className={className}
      disabled={disabled}
      options={options}
      onSelect={(optionId) => onChange(optionId as IssueType)}
      trigger={
        <span
          title={typeLabel}
          className={cn(
            compact
              ? 'inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-devflow-muted/60'
              : cn(INLINE_CELL_TRIGGER, 'gap-1.5'),
          )}
        >
          <Icon className="size-3.5 shrink-0 text-devflow-text-muted" strokeWidth={2} />
          <span className="min-w-0 truncate text-caption text-devflow-text-secondary">
            {typeLabel}
          </span>
        </span>
      }
    />
  )
}
