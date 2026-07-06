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
  layout?: 'default' | 'grid'
}

export function RadioOptionGroup<T extends string>({
  name,
  label,
  value,
  options,
  onChange,
  className,
  layout = 'default',
}: RadioOptionGroupProps<T>) {
  const isGrid = layout === 'grid'

  return (
    <fieldset className={cn('flex flex-col gap-1.5', className)}>
      <legend className="text-label text-devflow-text-secondary">{label}</legend>
      <div
        className={cn(
          isGrid
            ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
            : 'flex flex-col gap-2 sm:flex-row sm:gap-2',
        )}
      >
        {options.map((option) => {
          const checked = value === option.value
          const inputId = `${name}-${option.value}`

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={cn(
                'flex cursor-pointer gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
                isGrid
                  ? 'h-full min-h-[2.75rem] items-center'
                  : 'flex-1 items-start',
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
                className={cn(
                  'size-4 shrink-0 accent-devflow-primary',
                  isGrid ? undefined : 'mt-0.5',
                )}
              />
              <span className={cn(isGrid ? 'min-w-0 flex-1' : 'min-w-0')}>
                <span
                  className={cn(
                    'block text-body font-medium text-devflow-text',
                    isGrid && 'whitespace-nowrap',
                  )}
                >
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
