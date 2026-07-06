import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react'
import { Navigate, useParams } from 'react-router-dom'
import {
  getProjectBoardConfig,
  updateProjectBoardConfig,
  type KanbanBoardColumnConfigApi,
  type KanbanBoardConfigApi,
} from '@/api/boardConfig'
import { ApiError } from '@/api/types'
import { projectBoardPath } from '@/constants/routes'
import { Button } from '@/components/ui/Button'
import { useProjectMethodology } from '@/hooks/useProjectMethodology'

function cloneBoardConfig(config: KanbanBoardConfigApi): KanbanBoardConfigApi {
  return {
    columns: config.columns.map((column) => ({ ...column })),
  }
}

function sortColumns(columns: KanbanBoardColumnConfigApi[]) {
  return [...columns].sort((a, b) => a.display_order - b.display_order)
}

export function ProjectSettingsBoardPage() {
  const { projectId = '' } = useParams()
  const { isKanban } = useProjectMethodology(projectId)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [initialConfig, setInitialConfig] = useState<KanbanBoardConfigApi | null>(null)
  const [config, setConfig] = useState<KanbanBoardConfigApi | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      if (!projectId || !isKanban) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const boardConfig = await getProjectBoardConfig(projectId)
        if (cancelled) return
        const normalized = { columns: sortColumns(boardConfig.columns) }
        setInitialConfig(cloneBoardConfig(normalized))
        setConfig(cloneBoardConfig(normalized))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load board settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadConfig()
    return () => {
      cancelled = true
    }
  }, [projectId, isKanban])

  const orderedColumns = useMemo(
    () => (config ? sortColumns(config.columns) : []),
    [config],
  )

  const isDirty = useMemo(() => {
    if (!initialConfig || !config) return false
    return JSON.stringify(initialConfig.columns) !== JSON.stringify(sortColumns(config.columns))
  }, [config, initialConfig])

  if (!isKanban) {
    return <Navigate to={projectBoardPath(projectId)} replace />
  }

  function patchColumn(
    statusId: string,
    patch: Partial<KanbanBoardColumnConfigApi>,
  ) {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        columns: prev.columns.map((column) =>
          column.status_id === statusId ? { ...column, ...patch } : column,
        ),
      }
    })
    setSaved(false)
    setSaveError(null)
  }

  function moveColumn(statusId: string, direction: -1 | 1) {
    setConfig((prev) => {
      if (!prev) return prev
      const columns = sortColumns(prev.columns)
      const index = columns.findIndex((column) => column.status_id === statusId)
      const targetIndex = index + direction
      if (index < 0 || targetIndex < 0 || targetIndex >= columns.length) return prev

      const next = [...columns]
      const [item] = next.splice(index, 1)
      next.splice(targetIndex, 0, item)
      return {
        columns: next.map((column, order) => ({ ...column, display_order: order })),
      }
    })
    setSaved(false)
    setSaveError(null)
  }

  async function handleSave() {
    if (!projectId || !config) return

    setSaving(true)
    setSaveError(null)
    setSaved(false)

    try {
      const payload = {
        columns: sortColumns(config.columns).map((column, index) => ({
          status_id: column.status_id,
          wip_limit: column.wip_limit,
          is_enabled: column.is_enabled,
          display_order: index,
        })),
      }
      const updated = await updateProjectBoardConfig(projectId, payload)
      const normalized = { columns: sortColumns(updated.columns) }
      setInitialConfig(cloneBoardConfig(normalized))
      setConfig(cloneBoardConfig(normalized))
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save board settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
        <Loader2 className="size-4 animate-spin" />
        Loading board settings…
      </div>
    )
  }

  if (error) {
    return <p className="text-body text-devflow-error">{error}</p>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-page-title text-devflow-text">Board settings</h1>
        <p className="mt-1 text-body text-devflow-text-secondary">
          Configure Kanban column visibility, order, and WIP limits. WIP counts use all
          top-level issues in each column and are not blocked when exceeded.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-devflow-border bg-devflow-surface">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem_5.5rem_5rem] gap-3 border-b border-devflow-border px-4 py-3 text-caption font-semibold uppercase tracking-wide text-devflow-text-muted">
          <span>Column</span>
          <span>WIP limit</span>
          <span>Visible</span>
          <span>Order</span>
        </div>

        {orderedColumns.map((column, index) => (
          <div
            key={column.status_id}
            className="grid grid-cols-[minmax(0,1fr)_7rem_5.5rem_5rem] items-center gap-3 border-b border-devflow-border px-4 py-3 last:border-b-0"
          >
            <div>
              <p className="text-body font-medium text-devflow-text">{column.status_name}</p>
              <p className="text-caption text-devflow-text-muted">{column.status_slug}</p>
            </div>

            <input
              type="number"
              min={1}
              placeholder="None"
              value={column.wip_limit ?? ''}
              onChange={(event) => {
                const raw = event.target.value.trim()
                patchColumn(column.status_id, {
                  wip_limit: raw === '' ? null : Number(raw),
                })
              }}
              className="h-9 rounded-lg border border-devflow-border bg-devflow-card px-2 text-body text-devflow-text"
            />

            <label className="inline-flex items-center gap-2 text-body text-devflow-text-secondary">
              <input
                type="checkbox"
                checked={column.is_enabled}
                onChange={(event) =>
                  patchColumn(column.status_id, { is_enabled: event.target.checked })
                }
              />
              Show
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded-md border border-devflow-border p-1 text-devflow-text-secondary disabled:opacity-40"
                aria-label={`Move ${column.status_name} up`}
                disabled={index === 0}
                onClick={() => moveColumn(column.status_id, -1)}
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                className="rounded-md border border-devflow-border p-1 text-devflow-text-secondary disabled:opacity-40"
                aria-label={`Move ${column.status_name} down`}
                disabled={index === orderedColumns.length - 1}
                onClick={() => moveColumn(column.status_id, 1)}
              >
                <ArrowDown className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {saveError ? <p className="text-body text-devflow-error">{saveError}</p> : null}
      {saved ? (
        <p className="text-body text-devflow-success">Board settings saved.</p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={() => void handleSave()} disabled={saving || !isDirty}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {isDirty ? (
          <span className="text-caption text-devflow-text-muted">Unsaved changes</span>
        ) : null}
      </div>
    </div>
  )
}
