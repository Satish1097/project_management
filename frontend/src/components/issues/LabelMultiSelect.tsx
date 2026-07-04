import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useProjectLabelsData } from '@/hooks/useProjectLabelsData'
import { getLabels, addLabel } from '@/services/labelsRegistry'

type LabelMultiSelectProps = {
  selected: string[]
  onChange: (labels: string[]) => void
  projectId?: string
}

export function LabelMultiSelect({
  selected,
  onChange,
  projectId,
}: LabelMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [mockLabels, setMockLabels] = useState(() => getLabels())

  const useApi = Boolean(projectId)
  const { labels: apiLabels, loading } = useProjectLabelsData(projectId ?? '')

  const allLabels = useMemo(() => {
    if (useApi) {
      return apiLabels.map((label) => ({ id: label.id, name: label.name }))
    }
    return mockLabels.map((name) => ({ id: name, name }))
  }, [useApi, apiLabels, mockLabels])

  const selectedNames = useMemo(() => {
    return selected.map((value) => {
      const match = allLabels.find((label) => label.id === value)
      return match?.name ?? value
    })
  }, [allLabels, selected])

  const available = useMemo(
    () => allLabels.filter((label) => !selected.includes(label.id)),
    [allLabels, selected],
  )

  const toggle = (labelId: string) => {
    onChange(
      selected.includes(labelId)
        ? selected.filter((id) => id !== labelId)
        : [...selected, labelId],
    )
  }

  const handleCreate = () => {
    if (useApi) return
    const created = addLabel(newLabel)
    if (created) {
      setMockLabels(getLabels())
      onChange([...selected, created])
      setNewLabel('')
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-label text-devflow-text-secondary">Labels / tags</span>

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNames.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-md bg-devflow-pill px-2 py-0.5 text-caption text-devflow-text"
            >
              {label}
              <button
                type="button"
                onClick={() => {
                  const match = allLabels.find((item) => item.name === label)
                  if (match) toggle(match.id)
                }}
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
          {loading ? (
            <p className="text-caption text-devflow-text-muted">Loading labels…</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {available.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggle(label.id)}
                  className="rounded-md border border-devflow-border bg-devflow-card px-2 py-0.5 text-caption capitalize text-devflow-text-secondary hover:border-devflow-primary/40"
                >
                  {label.name}
                </button>
              ))}
            </div>
          )}
          {!useApi && (
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
          )}
        </div>
      )}
    </div>
  )
}
