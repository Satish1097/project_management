import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export type SelectOption = {
  value: string
  label: string
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: SelectOption[]
  hint?: string
  error?: string
}

export function SelectField({
  label,
  options,
  hint,
  error,
  id,
  className,
  ...props
}: SelectFieldProps) {
  const fieldId =
    id ?? label.toLowerCase().replace(/\s+/g, '-').replace(/\*/g, '')

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className="text-label text-devflow-text-secondary">
        {label}
      </label>
      <div className="relative">
        <select
          id={fieldId}
          className={cn(
            'w-full appearance-none rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-3 pr-9 text-input text-devflow-text outline-none transition-colors focus:border-devflow-primary focus:bg-devflow-card focus:ring-2 focus:ring-devflow-primary/20',
            error && 'border-devflow-error',
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-devflow-text-muted"
          aria-hidden
        />
      </div>
      {hint && !error && (
        <p className="text-caption text-devflow-text-muted">{hint}</p>
      )}
      {error && (
        <p className="text-caption text-devflow-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
