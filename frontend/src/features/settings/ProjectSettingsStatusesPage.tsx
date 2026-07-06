import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import {
  getWorkflow,
  updateWorkflow,
  type WorkflowConfigApi,
  type WorkflowStatusApi,
  type WorkflowUpdatePayload,
} from '@/api/workflow'
import { ApiError } from '@/api/types'
import { Button } from '@/components/ui/Button'

const CATEGORY_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
] as const

function cloneWorkflow(config: WorkflowConfigApi): WorkflowConfigApi {
  return {
    ...config,
    statuses: config.statuses.map((status) => ({ ...status })),
    transitions: config.transitions.map((transition) => ({ ...transition })),
  }
}

function buildUpdatePayload(config: WorkflowConfigApi): WorkflowUpdatePayload {
  const statusBySlug = new Map(config.statuses.map((status) => [status.slug, status.id]))

  return {
    statuses: config.statuses.map((status) => ({
      id: status.id,
      name: status.name.trim(),
      category: status.category,
      order: status.order,
      is_default: status.is_default,
    })),
    transitions: config.transitions.map((transition) => ({
      from_status_id: statusBySlug.get(transition.from_status_slug) ?? transition.from_status_slug,
      to_status_id: statusBySlug.get(transition.to_status_slug) ?? transition.to_status_slug,
      name: transition.name,
    })),
  }
}

function validateWorkflow(config: WorkflowConfigApi): string | null {
  if (config.statuses.length === 0) return 'At least one status is required.'
  for (const status of config.statuses) {
    if (!status.name.trim()) return 'Status names cannot be empty.'
    if (!CATEGORY_OPTIONS.some((option) => option.value === status.category)) {
      return `Invalid category for "${status.name}".`
    }
    if (status.order < 0 || !Number.isInteger(status.order)) {
      return `Invalid order for "${status.name}".`
    }
  }
  return null
}

export function ProjectSettingsStatusesPage() {
  const { projectId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [initialWorkflow, setInitialWorkflow] = useState<WorkflowConfigApi | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowConfigApi | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadWorkflow() {
      if (!projectId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setSaveError(null)
      setSaved(false)
      try {
        const data = await getWorkflow(projectId)
        if (cancelled) return
        const snapshot = cloneWorkflow(data)
        setInitialWorkflow(snapshot)
        setWorkflow(cloneWorkflow(snapshot))
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load workflow settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadWorkflow()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const hasChanges = useMemo(() => {
    if (!initialWorkflow || !workflow) return false
    return JSON.stringify(initialWorkflow) !== JSON.stringify(workflow)
  }, [initialWorkflow, workflow])

  const sortedStatuses = useMemo(() => {
    if (!workflow) return []
    return [...workflow.statuses].sort((a, b) => a.order - b.order)
  }, [workflow])

  function patchStatus(statusId: string, patch: Partial<WorkflowStatusApi>) {
    setWorkflow((current) => {
      if (!current) return current
      return {
        ...current,
        statuses: current.statuses.map((status) =>
          status.id === statusId ? { ...status, ...patch } : status,
        ),
      }
    })
    setSaved(false)
    setSaveError(null)
  }

  const handleDiscard = () => {
    if (!initialWorkflow) return
    setWorkflow(cloneWorkflow(initialWorkflow))
    setSaveError(null)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!projectId || !workflow || saving) return

    const validationError = validateWorkflow(workflow)
    if (validationError) {
      setSaveError(validationError)
      setSaved(false)
      return
    }

    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const payload = buildUpdatePayload(workflow)
      const updated = await updateWorkflow(projectId, payload)
      const snapshot = cloneWorkflow(updated)
      setInitialWorkflow(snapshot)
      setWorkflow(cloneWorkflow(snapshot))
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save workflow settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading workflow settings…
      </div>
    )
  }

  if (error || !workflow) {
    return <p className="text-body text-devflow-error">{error ?? 'Workflow not found.'}</p>
  }

  return (
    <>
      <header className="mb-4">
        <h1 className="text-page-title text-devflow-text">Statuses</h1>
        <p className="mt-1 text-body text-devflow-text-secondary">
          Configure workflow columns and issue statuses for this project.
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-devflow-border text-left">
              <th className="px-4 py-2 text-caption font-medium tracking-[0.24px] text-devflow-text-secondary">
                STATUS
              </th>
              <th className="px-4 py-2 text-caption font-medium tracking-[0.24px] text-devflow-text-secondary">
                CATEGORY
              </th>
              <th className="px-4 py-2 text-caption font-medium tracking-[0.24px] text-devflow-text-secondary">
                ORDER
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStatuses.map((status) => (
              <tr key={status.id} className="border-b border-devflow-border last:border-0">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={status.name}
                    onChange={(event) => patchStatus(status.id, { name: event.target.value })}
                    className="w-full rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-body text-devflow-text outline-none focus:ring-2 focus:ring-devflow-primary/20"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={status.category}
                    onChange={(event) => patchStatus(status.id, { category: event.target.value })}
                    className="w-full rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-body text-devflow-text outline-none focus:ring-2 focus:ring-devflow-primary/20"
                  >
                    {CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={status.order}
                    onChange={(event) =>
                      patchStatus(status.id, {
                        order: Number.parseInt(event.target.value || '0', 10),
                      })
                    }
                    className="w-28 rounded-lg border border-devflow-border bg-devflow-muted px-3 py-2 text-body text-devflow-text outline-none focus:ring-2 focus:ring-devflow-primary/20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {saveError && <p className="mt-4 text-body text-devflow-error">{saveError}</p>}
      {saved && !saveError && (
        <p className="mt-4 text-body text-devflow-success">
          Workflow validated successfully (persistence is temporary).
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-devflow-border pt-4">
        <Button variant="outline" className="w-auto" onClick={handleDiscard} disabled={saving || !hasChanges}>
          Discard
        </Button>
        <Button className="w-auto" onClick={() => void handleSave()} disabled={saving || !hasChanges}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </>
  )
}
