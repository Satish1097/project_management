import type { InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const checkboxId = id ?? `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <label
      htmlFor={checkboxId}
      className={cn('flex w-full cursor-pointer items-center gap-2', className)}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className="size-4 shrink-0 rounded border border-devflow-border accent-devflow-primary"
        {...props}
      />
      <span className="text-body text-devflow-text-secondary">
        {label}
      </span>
    </label>
  )
}
