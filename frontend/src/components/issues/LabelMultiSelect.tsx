import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { getLabels, addLabel } from '@/services/labelsRegistry'
type LabelMultiSelectProps = {
  selected: string[]
  onChange: (labels: string[]) => void
}

export function LabelMultiSelect({ selected, onChange }: LabelMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [allLabels, setAllLabels] = useState(() => getLabels())

  const available = useMemo(
    () => allLabels.filter((l) => !selected.includes(l)),
    [allLabels, selected],
  )

  const toggle = (label: string) => {
    onChange(
      selected.includes(label)
        ? selected.filter((l) => l !== label)
        : [...selected, label],
    )
  }

  const handleCreate = () => {
    const created = addLabel(newLabel)
    if (created) {
      setAllLabels(getLabels())
      onChange([...selected, created])
      setNewLabel('')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-devflow-text-secondary">Labels / tags</span>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md bg-devflow-pill px-2 py-0.5 text-caption text-devflow-text"
            >
              {label}
              <button
                type="button"
                onClick={() => toggle(label)}
                className="text-devflow-text-muted hover:text-devflow-text"
                aria-label={`Remove ${label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-dashed border-devflow-border px-3 py-2 text-caption text-devflow-text-secondary hover:border-devflow-primary/50 hover:text-devflow-primary"
      >
        {selected.length === 0 ? 'Add labels…' : 'Edit labels'}
      </button>

      {open && (
        <div className="rounded-lg border border-devflow-border bg-devflow-surface p-2">
          <div className="flex flex-wrap gap-1.5">
            {available.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                className="rounded-md border border-devflow-border bg-devflow-card px-2 py-0.5 text-caption capitalize text-devflow-text-secondary hover:border-devflow-primary/40"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="New label"
              className="min-w-0 flex-1 rounded-md border border-devflow-border bg-devflow-card px-2 py-1 text-input outline-none focus:border-devflow-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreate()
                }
              }}
            />
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-1 rounded-md bg-devflow-primary px-2 py-1 text-caption text-white"
            >
              <Plus className="size-3" />
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
