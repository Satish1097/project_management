import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  createProjectLabel,
  deleteProjectLabel,
  updateProjectLabel,
  type LabelApi,
} from '@/api/labels'
import { ApiError } from '@/api/types'
import { CreateLabelModal } from '@/features/settings/CreateLabelModal'
import { useProjectLabelsData } from '@/hooks/useProjectLabelsData'
import {
  addProjectLabelToStore,
  removeProjectLabelFromStore,
  updateProjectLabelInStore,
} from '@/services/projectLabelsStore'

type UiLabel = {
  id: string
  name: string
  description: string
  dotColor: string
  bgColor: string
  textColor: string
}

function isValidHexColor(value: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(value)
}

function hexToRgba(hex: string, alpha: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mapApiLabelToUiLabel(label: LabelApi): UiLabel {
  const color = isValidHexColor(label.color) ? label.color : '#6366f1'
  return {
    id: label.id,
    name: label.name,
    description: '',
    dotColor: color,
    bgColor: hexToRgba(color, 0.16),
    textColor: color,
  }
}

export function ProjectSettingsLabelsPage() {
  const { projectId = '' } = useParams()
  const { labels, loading, error: loadError } = useProjectLabelsData(projectId)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [editingLabel, setEditingLabel] = useState<LabelApi | null>(null)

  const uiLabels = useMemo(() => labels.map(mapApiLabelToUiLabel), [labels])

  function openCreateLabelModal() {
    setEditingLabel(null)
    setLabelModalOpen(true)
  }

  function openEditLabelModal(label: LabelApi) {
    setEditingLabel(label)
    setLabelModalOpen(true)
  }

  function closeLabelModal() {
    if (submitting) return
    setLabelModalOpen(false)
    setEditingLabel(null)
  }

  async function handleLabelModalSubmit({
    name,
    color,
  }: {
    name: string
    color: string
    description: string
  }) {
    if (!projectId) return

    setSubmitting(true)
    setError(null)
    try {
      if (editingLabel) {
        const updated = await updateProjectLabel(projectId, editingLabel.id, {
          name,
          color,
        })
        updateProjectLabelInStore(projectId, updated)
      } else {
        const created = await createProjectLabel(projectId, {
          name,
          color,
        })
        addProjectLabelToStore(projectId, created)
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : editingLabel
            ? 'Failed to update label.'
            : 'Failed to create label.'
      throw new Error(message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteLabel(label: LabelApi) {
    if (!projectId || submitting) return
    if (!window.confirm(`Delete label "${label.name}"?`)) return

    setSubmitting(true)
    setError(null)
    try {
      await deleteProjectLabel(projectId, label.id)
      removeProjectLabelFromStore(projectId, label.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete label.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
        <Loader2 className="size-4 animate-spin" />
        Loading labels...
      </div>
    )
  }

  const displayError = error ?? loadError

  if (displayError && uiLabels.length === 0) {
    return <p className="text-body text-red-600">{displayError}</p>
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-devflow-text">Labels</h1>
          <p className="text-body text-devflow-text-secondary">
            Create and manage labels to organize issues and roadmaps.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateLabelModal}
          disabled={submitting}
          className="inline-flex items-center gap-1 rounded-lg bg-devflow-brand-deep px-4 py-1.5 text-btn text-white"
        >
          <Plus className="size-2.5" strokeWidth={2.5} />
          Create Label
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {displayError ? <p className="text-body text-red-600">{displayError}</p> : null}
        {uiLabels.map((label) => {
          const source = labels.find((item) => item.id === label.id)
          if (!source) return null
          return (
          <div
            key={label.id}
            className="group flex h-12 items-center justify-between rounded-lg border border-devflow-border bg-devflow-card px-3"
          >
            <div className="flex items-center gap-4">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-caption-label"
                style={{
                  backgroundColor: label.bgColor,
                  color: label.textColor,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: label.dotColor }}
                />
                {label.name}
              </span>
              <span className="text-body text-devflow-text-secondary">
                {label.description}
              </span>
            </div>
            <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                className="p-2 text-devflow-text-secondary"
                onClick={() => openEditLabelModal(source)}
                disabled={submitting}
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                className="p-2 text-devflow-text-secondary"
                onClick={() => void handleDeleteLabel(source)}
                disabled={submitting}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          )
        })}
        <p className="text-center text-caption-label tracking-[1px] text-devflow-text-muted">
          <Link to="#" className="hover:underline">
            Manage archived labels
          </Link>
        </p>
      </div>

      <CreateLabelModal
        open={labelModalOpen}
        onClose={closeLabelModal}
        onSubmit={handleLabelModalSubmit}
        title={editingLabel ? 'Edit Label' : 'Create Label'}
        submitLabel={editingLabel ? 'Save Label' : 'Create Label'}
        initialName={editingLabel?.name ?? ''}
        initialColor={
          editingLabel && isValidHexColor(editingLabel.color)
            ? editingLabel.color
            : '#6366f1'
        }
      />
    </>
  )
}
