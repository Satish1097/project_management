import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import { FormField } from '@/components/ui/FormField'
import { cn } from '@/utils/cn'

export const LABEL_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#8b5cf6',
  '#10b981',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#64748b',
] as const

const DEFAULT_LABEL_COLOR = LABEL_COLORS[0]

type CreateLabelModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: { name: string; color: string; description: string }) => Promise<void>
  title?: string
  submitLabel?: string
  initialName?: string
  initialColor?: string
  initialDescription?: string
}

export function CreateLabelModal({
  open,
  onClose,
  onSubmit,
  title = 'Create Label',
  submitLabel = 'Create Label',
  initialName = '',
  initialColor = DEFAULT_LABEL_COLOR,
  initialDescription = '',
}: CreateLabelModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [color, setColor] = useState(initialColor)
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const resetForm = useCallback(() => {
    setName(initialName)
    setDescription(initialDescription)
    setColor(
      LABEL_COLORS.includes(initialColor as (typeof LABEL_COLORS)[number])
        ? initialColor
        : DEFAULT_LABEL_COLOR,
    )
    setSubmitting(false)
    setSubmitAttempted(false)
    setSubmitError(null)
  }, [initialColor, initialDescription, initialName])

  useEffect(() => {
    if (!open) return
    resetForm()
  }, [open, resetForm])

  const nameError =
    submitAttempted && !name.trim() ? 'Label name is required' : undefined

  const handleClose = () => {
    if (submitting) return
    onClose()
  }

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, submitting])

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    setSubmitError(null)
    if (!name.trim() || submitting) return

    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        color,
        description: description.trim(),
      })
      onClose()
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to save label. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-label-title"
        className="relative w-full max-w-[500px] rounded-lg border border-devflow-border bg-devflow-card p-5 shadow-devflow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="create-label-title" className="text-section-title text-devflow-text">
              {title}
            </h2>
            <p className="mt-1 text-body text-devflow-text-secondary">
              Labels help organize and filter issues across your project.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-1.5 text-devflow-text-secondary hover:bg-devflow-surface disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSubmit()
          }}
        >
          <FormField
            label="Label Name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={nameError}
            placeholder="e.g. Bug, Feature, Documentation"
            disabled={submitting}
            autoFocus
          />

          <FormField
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description for this label"
            disabled={submitting}
          />

          <div className="flex flex-col gap-1">
            <span className="text-label text-devflow-text-secondary">Color</span>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-label={`Color ${option}`}
                  aria-pressed={color === option}
                  disabled={submitting}
                  onClick={() => setColor(option)}
                  className={cn(
                    'size-8 rounded-full border-2 transition disabled:cursor-not-allowed disabled:opacity-60',
                    color === option
                      ? 'border-devflow-primary ring-2 ring-devflow-primary/25'
                      : 'border-transparent hover:scale-105',
                  )}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>

          {submitError ? (
            <p className="text-caption text-devflow-error" role="alert">
              {submitError}
            </p>
          ) : null}

          <div className="mt-1 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
