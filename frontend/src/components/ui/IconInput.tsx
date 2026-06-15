import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon: ReactNode
  trailing?: ReactNode
}

export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  function IconInput({ className, label, icon, trailing, id, ...props }, ref) {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex w-full flex-col gap-1">
        <label
          htmlFor={inputId}
          className="text-label text-devflow-text-secondary"
        >
          {label}
        </label>
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
            {icon}
          </span>
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border border-devflow-border bg-devflow-surface py-2 pl-9 pr-3 text-input text-devflow-text outline-none transition-colors placeholder:text-devflow-text-muted/60 focus:border-devflow-primary focus:bg-devflow-card focus:ring-2 focus:ring-devflow-primary/20',
              trailing && 'pr-12',
              className,
            )}
            {...props}
          />
          {trailing}
        </div>
      </div>
    )
  },
)
