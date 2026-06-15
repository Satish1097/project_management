import { useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  labelAction?: React.ReactNode
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden>
        <path
          d="M9 0.5C5 0.5 1.73 2.61 0 5.5C1.73 8.39 5 10.5 9 10.5C13 10.5 16.27 8.39 18 5.5C16.27 2.61 13 0.5 9 0.5ZM9 9C7.07 9 5.5 7.43 5.5 5.5C5.5 3.57 7.07 2 9 2C10.93 2 12.5 3.57 12.5 5.5C12.5 7.43 10.93 9 9 9ZM9 3.5C7.9 3.5 7 4.4 7 5.5C7 6.6 7.9 7.5 9 7.5C10.1 7.5 11 6.6 11 5.5C11 4.4 10.1 3.5 9 3.5Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden>
      <path
        d="M0.5 0.5L17.5 12.5M7.5 5.2C7.18 5.66 7 6.22 7 6.8C7 8.01 7.99 9 9.2 9C9.78 9 10.34 8.82 10.8 8.5M2.2 2.8C4.1 1.4 6.4 0.5 9 0.5C13 0.5 16.27 2.61 18 5.5C17.2 6.77 16.05 7.8 14.7 8.5M11.5 9.8C10.45 10.42 9.27 10.75 8 10.75C4.55 10.75 1.75 8.3 0.5 5.5C1.05 4.45 1.85 3.5 2.8 2.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PasswordInput({
  className,
  label,
  labelAction,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const inputId = id ?? 'password'

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
      <div className="relative w-full">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full rounded-lg border border-devflow-border bg-devflow-card px-3 py-2 pr-10 text-input text-devflow-text outline-none transition-colors placeholder:text-devflow-text-muted focus:border-devflow-primary focus:ring-2 focus:ring-devflow-primary/20',
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-devflow-text-muted [&_svg]:text-devflow-text-muted"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  )
}
