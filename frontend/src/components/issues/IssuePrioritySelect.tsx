import type { IssuePriorityLevel } from '@/types/issues'
import { ISSUE_PRIORITY_OPTIONS } from '@/constants/issueOptions'
import { cn } from '@/utils/cn'

const badgeStyles: Record<IssuePriorityLevel, string> = {
  lowest: 'bg-devflow-muted text-devflow-text-muted',
  low: 'bg-devflow-pill text-devflow-text-secondary',
  medium: 'bg-[var(--df-nav-tint)] text-devflow-primary',
  high: 'bg-devflow-warning-bg text-devflow-warning',
  critical: 'bg-devflow-danger-bg text-devflow-danger-text',
  blocker: 'bg-devflow-error/15 text-devflow-error font-semibold',
}

type IssuePrioritySelectProps = {
  value: IssuePriorityLevel
  onChange: (value: IssuePriorityLevel) => void
}

export function IssuePrioritySelect({
  value,
  onChange,
}: IssuePrioritySelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="issue-priority" className="text-label text-devflow-text-secondary">
        Priority <span className="text-devflow-error">*</span>
      </label>
      <select
        id="issue-priority"
        value={value}
        onChange={(e) => onChange(e.target.value as IssuePriorityLevel)}
        className="w-full rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2 text-input text-devflow-text outline-none focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20"
      >
        {ISSUE_PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        className={cn(
          'inline-flex w-fit rounded px-2 py-0.5 text-caption-label',
          badgeStyles[value],
        )}
      >
        {ISSUE_PRIORITY_OPTIONS.find((o) => o.value === value)?.label}
      </span>
    </div>
  )
}
