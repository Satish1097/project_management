import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { RadioOptionGroup } from '@/components/ui/RadioOptionGroup'
import { SelectField } from '@/components/ui/SelectField'
import { useSprints } from '@/contexts/SprintsContext'
import type { Sprint } from '@/types/sprints'

type CompleteSprintModalProps = {
  open: boolean
  onClose: () => void
  projectId: string
  sprint: Sprint
  onComplete: (options: {
    destination: 'backlog' | 'sprint'
    targetSprintId?: string
  }) => Promise<void>
}

export function CompleteSprintModal({
  open,
  onClose,
  projectId,
  sprint,
  onComplete,
}: CompleteSprintModalProps) {
  const { sprints } = useSprints()
  const [destination, setDestination] = useState<'backlog' | 'sprint'>('backlog')
  const [targetSprintId, setTargetSprintId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDestination('backlog')
    setTargetSprintId('')
    setSubmitting(false)
    setError(null)
  }, [open, sprint.id])

  const plannedSprints = useMemo(
    () =>
      sprints.filter(
        (s) =>
          s.projectId === projectId &&
          s.status === 'planned' &&
          s.id !== sprint.id,
      ),
    [sprints, projectId, sprint.id],
  )

  if (!open) return null

  const completed = sprint.completedCount
  const remaining = sprint.remainingCount
  const noPlannedSprints = plannedSprints.length === 0

  const handleComplete = async () => {
    if (remaining > 0 && destination === 'sprint' && !targetSprintId) {
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onComplete({
        destination,
        targetSprintId: destination === 'sprint' ? targetSprintId : undefined,
      })
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete sprint.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-lg border border-devflow-border bg-devflow-card p-5 shadow-devflow-lg"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-section-title text-devflow-text">
              Complete {sprint.name}
            </h2>
            <p className="mt-1 text-caption text-devflow-text-muted">
              Review outcomes and move unfinished work.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-devflow-text-secondary hover:bg-devflow-surface"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2">
            <p className="text-caption text-devflow-text-muted">Completed</p>
            <p className="text-metric text-devflow-text">{completed}</p>
          </div>
          <div className="rounded-lg border border-devflow-border bg-devflow-surface px-3 py-2">
            <p className="text-caption text-devflow-text-muted">Remaining</p>
            <p className="text-metric text-devflow-text">{remaining}</p>
          </div>
        </div>

        {remaining > 0 && (
          <div className="mb-4 flex flex-col gap-3">
            <RadioOptionGroup
              name="complete-destination"
              label="Move remaining issues to"
              value={destination}
              onChange={setDestination}
              options={[
                { value: 'backlog', label: 'Backlog' },
                {
                  value: 'sprint',
                  label: 'Another sprint',
                  description: 'Choose a planned sprint',
                },
              ]}
            />
            {destination === 'sprint' && (
              <>
                <SelectField
                  label="Target sprint"
                  value={targetSprintId}
                  options={[
                    { value: '', label: 'Select sprint…' },
                    ...plannedSprints.map((s) => ({
                      value: s.id,
                      label: s.name,
                    })),
                  ]}
                  onChange={(e) => setTargetSprintId(e.target.value)}
                  error={
                    noPlannedSprints
                      ? 'No planned sprint available. Create a new sprint or move issues to the backlog.'
                      : undefined
                  }
                />
                {noPlannedSprints && (
                  <p className="text-caption text-devflow-text-muted">
                    No planned sprint available. Create a new sprint or move
                    issues to the backlog.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <p className="mb-4 text-caption text-devflow-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              submitting ||
              (remaining > 0 &&
                destination === 'sprint' &&
                (!targetSprintId || noPlannedSprints))
            }
            onClick={() => void handleComplete()}
            className="rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:opacity-50"
          >
            {submitting ? 'Completing…' : 'Complete sprint'}
          </button>
        </div>
      </div>
    </div>
  )
}
