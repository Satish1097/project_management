import { useState } from 'react'
import { X } from 'lucide-react'
import { RadioOptionGroup } from '@/components/ui/RadioOptionGroup'
import { SelectField } from '@/components/ui/SelectField'
import { getSprintsForProject } from '@/services/projectData'
import { getSprintIssues } from '@/services/issuesRegistry'
import type { Sprint } from '@/types/sprints'

type CompleteSprintModalProps = {
  open: boolean
  onClose: () => void
  projectId: string
  sprint: Sprint
  onComplete: (options: {
    destination: 'backlog' | 'sprint'
    targetSprintId?: string
  }) => void
}

export function CompleteSprintModal({
  open,
  onClose,
  projectId,
  sprint,
  onComplete,
}: CompleteSprintModalProps) {
  const [destination, setDestination] = useState<'backlog' | 'sprint'>('backlog')
  const [targetSprintId, setTargetSprintId] = useState('')

  if (!open) return null

  const issues = getSprintIssues(projectId, sprint.id)
  const completed = issues.filter((i) => i.done || i.status === 'done').length
  const remaining = issues.length - completed

  const plannedSprints = getSprintsForProject(projectId).filter(
    (s) => s.status === 'planned' && s.id !== sprint.id,
  )

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
              />
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              remaining > 0 &&
              destination === 'sprint' &&
              !targetSprintId
            }
            onClick={() => {
              onComplete({
                destination,
                targetSprintId:
                  destination === 'sprint' ? targetSprintId : undefined,
              })
              onClose()
            }}
            className="rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:opacity-50"
          >
            Complete sprint
          </button>
        </div>
      </div>
    </div>
  )
}
