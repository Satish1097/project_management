import { useEffect, useState } from 'react'

type ToastVariant = 'success' | 'error'

type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

const TOAST_DURATION_MS = 4000

let toasts: ToastItem[] = []
const listeners = new Set<(items: ToastItem[]) => void>()

function emit(): void {
  listeners.forEach((listener) => listener(toasts))
}

function dismissToast(id: string): void {
  toasts = toasts.filter((toast) => toast.id !== id)
  emit()
}

export function showToast(message: string, variant: ToastVariant): void {
  const id = crypto.randomUUID()
  toasts = [...toasts, { id, message, variant }]
  emit()
  window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastItem[]>(toasts)

  useEffect(() => {
    listeners.add(setItems)
    return () => {
      listeners.delete(setItems)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-full max-w-sm flex-col gap-2"
    >
      {items.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={
            toast.variant === 'success'
              ? 'rounded-lg border border-devflow-border bg-devflow-card px-4 py-3 text-body text-devflow-success shadow-devflow-md'
              : 'rounded-lg border border-devflow-border bg-devflow-card px-4 py-3 text-body text-devflow-error shadow-devflow-md'
          }
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
