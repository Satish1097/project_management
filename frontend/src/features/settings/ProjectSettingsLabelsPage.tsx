import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import {
  createProjectLabel,
  deleteProjectLabel,
  getProjectLabels,
  updateProjectLabel,
  type LabelApi,
} from '@/api/labels'
import { ApiError } from '@/api/types'

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
  const [labels, setLabels] = useState<LabelApi[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadLabels() {
      if (!projectId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const data = await getProjectLabels(projectId)
        if (!cancelled) {
          setLabels(data.filter((label) => !label.is_archived))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load labels.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadLabels()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const uiLabels = useMemo(() => labels.map(mapApiLabelToUiLabel), [labels])

  async function handleCreateLabel() {
    if (!projectId || submitting) return

    const name = window.prompt('Label name')
    if (!name?.trim()) return

    const colorInput = window.prompt('Label color (#RRGGBB)', '#6366F1')
    if (!colorInput) return
    const color = colorInput.trim()
    if (!isValidHexColor(color)) {
      setError('Color must be in #RRGGBB format.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const created = await createProjectLabel(projectId, { name: name.trim(), color })
      setLabels((prev) => [...prev, created].filter((label) => !label.is_archived))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create label.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditLabel(label: LabelApi) {
    if (!projectId || submitting) return

    const name = window.prompt('Edit label name', label.name)
    if (!name?.trim()) return

    const colorInput = window.prompt('Edit label color (#RRGGBB)', label.color)
    if (!colorInput) return
    const color = colorInput.trim()
    if (!isValidHexColor(color)) {
      setError('Color must be in #RRGGBB format.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const updated = await updateProjectLabel(projectId, label.id, {
        name: name.trim(),
        color,
      })
      setLabels((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update label.')
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
      setLabels((prev) => prev.filter((item) => item.id !== label.id))
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

  if (error && uiLabels.length === 0) {
    return <p className="text-body text-red-600">{error}</p>
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
          onClick={handleCreateLabel}
          disabled={submitting}
          className="inline-flex items-center gap-1 rounded-lg bg-devflow-brand-deep px-4 py-1.5 text-btn text-white"
        >
          <Plus className="size-2.5" strokeWidth={2.5} />
          Create Label
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {error ? <p className="text-body text-red-600">{error}</p> : null}
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
                onClick={() => void handleEditLabel(source)}
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
    </>
  )
}
