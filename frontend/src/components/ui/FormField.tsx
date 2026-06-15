import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const inputClassName =
  'w-full rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2 text-input text-devflow-text outline-none transition-colors placeholder:text-devflow-text-muted/60 focus:border-devflow-primary focus:bg-devflow-card focus:ring-2 focus:ring-devflow-primary/20 disabled:cursor-not-allowed disabled:opacity-60'

type FormFieldBaseProps = {
  label: string
  required?: boolean
  hint?: string
  error?: string
  id?: string
  className?: string
}

type FormFieldInputProps = FormFieldBaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    multiline?: false
  }

type FormFieldTextareaProps = FormFieldBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    multiline: true
    rows?: number
  }

type FormFieldProps = FormFieldInputProps | FormFieldTextareaProps

export function FormField(props: FormFieldProps) {
  const {
    label,
    required,
    hint,
    error,
    id,
    className,
    multiline,
    ...fieldProps
  } = props

  const fieldId =
    id ?? label.toLowerCase().replace(/\s+/g, '-').replace(/\*/g, '')

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={fieldId} className="text-label text-devflow-text-secondary">
        {label}
        {required && <span className="text-devflow-error"> *</span>}
      </label>

      {multiline ? (
        <textarea
          id={fieldId}
          rows={(props as FormFieldTextareaProps).rows ?? 3}
          className={cn(
            inputClassName,
            'resize-y min-h-[4.5rem]',
            error && 'border-devflow-error focus:border-devflow-error focus:ring-devflow-error/20',
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          {...(fieldProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          id={fieldId}
          className={cn(
            inputClassName,
            error && 'border-devflow-error focus:border-devflow-error focus:ring-devflow-error/20',
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          {...(fieldProps as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-caption text-devflow-text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-caption text-devflow-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-section-title text-devflow-text">{title}</h3>
        {description && (
          <p className="mt-0.5 text-caption text-devflow-text-muted">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}
