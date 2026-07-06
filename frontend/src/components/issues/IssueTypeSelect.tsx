import {
  BookOpen,
  Bug,
  GitBranch,
  Layers,
  Lightbulb,
  Sparkles,
  CheckSquare,
} from 'lucide-react'
import type { IssueType } from '@/types/issues'
import { ISSUE_TYPE_OPTIONS } from '@/constants/issueOptions'
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

type IssueTypeSelectProps = {
  value: IssueType
  onChange: (value: IssueType) => void
}

export function IssueTypeSelect({ value, onChange }: IssueTypeSelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-devflow-text-secondary">
        Issue type <span className="text-devflow-error">*</span>
      </span>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {ISSUE_TYPE_OPTIONS.map((opt) => {
          const Icon = icons[opt.value]
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-caption transition-colors',
                selected
                  ? 'border-devflow-primary bg-[var(--df-nav-tint)] text-devflow-primary'
                  : 'border-devflow-border bg-devflow-surface text-devflow-text-secondary hover:bg-devflow-card',
              )}
            >
              <Icon className="size-3.5 shrink-0" strokeWidth={2} />
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
