import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  labelAction?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, labelAction, id, ...props },
  ref,
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex w-full flex-col gap-1">
      {(label || labelAction) && (
        <div className="flex items-center justify-between">
          {label ? (
            <label
              htmlFor={inputId}
              className="text-label text-devflow-text-secondary"
            >
              {label}
            </label>
          ) : (
            <span />
          )}
          {labelAction}
        </div>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-devflow-border bg-white px-3 py-2 text-input text-devflow-text outline-none transition-colors placeholder:text-devflow-text-muted focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20',
          className,
        )}
        {...props}
      />
    </div>
  )
})
