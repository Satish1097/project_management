import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { getProject } from '@/api/projects'
import { ApiError } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useProjects } from '@/contexts/ProjectsContext'
import { mapProjectDetailToUi } from '@/services/mapProjectApi'
import { getProjectByIdFromRegistry, upsertProjectInRegistry } from '@/services/projectsRegistry'
import type { Project } from '@/types/projects'
import { PROJECT_DESCRIPTION_MAX_LENGTH, PROJECT_NAME_MAX_LENGTH } from '@/utils/projectKey'

export function ProjectSettingsGeneralPage() {
  const { projectId = '' } = useParams()
  const { updateProject } = useProjects()
  const [project, setProject] = useState<Project | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      if (!projectId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const detail = await getProject(projectId)
        if (cancelled) return
        const existing = getProjectByIdFromRegistry(projectId)
        const mapped = mapProjectDetailToUi(detail, existing?.openIssueCount)
        upsertProjectInRegistry(mapped)
        setProject(mapped)
        setName(mapped.name)
        setDescription(mapped.description)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Failed to load project settings.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProject()
    return () => {
      cancelled = true
    }
  }, [projectId])

  const handleDiscard = () => {
    if (!project) return
    setName(project.name)
    setDescription(project.description)
    setSaveError(null)
    setSaved(false)
  }

  const handleSave = async () => {
    if (!projectId || !name.trim() || saving) return

    setSaving(true)
    setSaveError(null)
    setSaved(false)

    try {
      const updated = await updateProject(projectId, {
        name: name.trim(),
        description: description.trim(),
      })
      setProject(updated)
      setName(updated.name)
      setDescription(updated.description)
      setSaved(true)
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Failed to save project settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-body text-devflow-text-secondary">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading project settings…
      </div>
    )
  }

  if (error || !project) {
    return (
      <p className="text-body text-devflow-error">
        {error ?? 'Project not found.'}
      </p>
    )
  }

  return (
    <>
      <header className="mb-4">
        <h1 className="text-page-title text-devflow-text">General Settings</h1>
        <p className="mt-1 text-body text-devflow-text-secondary">
          Update your project identity and description.
        </p>
      </header>

      <div className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-label text-devflow-text-secondary">
              Project Name
            </label>
            <Input
              value={name}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              className="bg-devflow-muted"
              onChange={(event) => {
                setName(event.target.value)
                setSaved(false)
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-label text-devflow-text-secondary">
              Project Key
            </label>
            <Input
              value={project.key ?? ''}
              readOnly
              className="bg-devflow-muted font-mono"
            />
            <p className="mt-1 text-caption text-devflow-text-secondary">
              Used as a prefix for issue IDs (e.g., {project.key}-101).
            </p>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label text-devflow-text-secondary">
            Description
          </label>
          <textarea
            value={description}
            maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
            onChange={(event) => {
              setDescription(event.target.value)
              setSaved(false)
            }}
            className="min-h-32 w-full rounded-lg border border-devflow-border bg-devflow-muted p-2.5 text-body text-devflow-text outline-none focus:ring-2 focus:ring-devflow-primary/20"
          />
        </div>
      </div>

      {saveError && (
        <p className="mt-4 text-body text-devflow-error">{saveError}</p>
      )}
      {saved && !saveError && (
        <p className="mt-4 text-body text-devflow-success">Changes saved.</p>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-devflow-border pt-4">
        <Button variant="outline" className="w-auto" onClick={handleDiscard} disabled={saving}>
          Discard
        </Button>
        <Button className="w-auto" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </>
  )
}
