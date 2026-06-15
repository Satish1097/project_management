import { cn } from '@/utils/cn'

export type RadioOption<T extends string> = {
  value: T
  label: string
  description?: string
}

type RadioOptionGroupProps<T extends string> = {
  name: string
  label: string
  value: T
  options: RadioOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function RadioOptionGroup<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  className,
}: RadioOptionGroupProps<T>) {
  return (
    <fieldset className={cn('flex flex-col gap-1.5', className)}>
      <legend className="text-label text-devflow-text-secondary">{label}</legend>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
        {options.map((option) => {
          const checked = value === option.value
          const inputId = `${name}-${option.value}`

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                'flex flex-1 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                checked
                  ? 'border-devflow-primary bg-[var(--df-nav-tint)] ring-1 ring-devflow-primary/25'
                  : 'border-devflow-border bg-devflow-surface hover:border-devflow-border/80 hover:bg-devflow-card',
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 size-4 shrink-0 accent-devflow-primary"
              />
              <span className="min-w-0">
                <span className="block text-body font-medium text-devflow-text">
                  {option.label}
                </span>
                {option.description && (
                  <span className="mt-0.5 block text-caption text-devflow-text-muted">
                    {option.description}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
