import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-devflow-primary text-white shadow-devflow-sm hover:bg-devflow-primary-hover',
  outline:
    'border border-devflow-border bg-devflow-card text-devflow-text hover:bg-devflow-surface',
}

export function Button({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex w-full items-center justify-center rounded-lg px-3 py-1.5 text-btn leading-normal transition-colors disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
