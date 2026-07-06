import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DrawerPanel } from '@/components/ui/DrawerPanel'
import { FormField, FormSection } from '@/components/ui/FormField'
import { RadioOptionGroup } from '@/components/ui/RadioOptionGroup'
import { SelectField } from '@/components/ui/SelectField'
import { projectOverviewPath } from '@/constants/routes'
import { useProjects } from '@/contexts/ProjectsContext'
import { ApiError } from '@/api/types'
import {
  DEFAULT_CREATE_PROJECT_VALUES,
  type CreateProjectFormValues,
} from '@/types/createProject'
import {
  generateProjectKey,
  generateProjectSlug,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from '@/utils/projectKey'
import { cn } from '@/utils/cn'

type CreateProjectDrawerProps = {
  open: boolean
  onClose: () => void
  onCreated?: (projectId: string) => void
}

type FieldErrors = Partial<Record<'name' | 'description', string>>

const SPRINT_DURATION_OPTIONS = [
  { value: '1', label: '1 Week' },
  { value: '2', label: '2 Weeks' },
  { value: '3', label: '3 Weeks' },
  { value: '4', label: '4 Weeks' },
  { value: 'custom', label: 'Custom' },
]

export function CreateProjectDrawer({ open, onClose, onCreated }: CreateProjectDrawerProps) {
  const navigate = useNavigate()
  const { createProject, projectKeys } = useProjects()
  const [values, setValues] = useState<CreateProjectFormValues>(DEFAULT_CREATE_PROJECT_VALUES)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [serverFieldErrors, setServerFieldErrors] = useState<FieldErrors>({})

  const resetForm = useCallback(() => {
    setValues(DEFAULT_CREATE_PROJECT_VALUES)
    setTouched({})
    setSubmitAttempted(false)
    setSubmitting(false)
    setSubmitError(null)
    setServerFieldErrors({})
  }, [])

  useEffect(() => {
    if (!open) return
    resetForm()
  }, [open, resetForm])

  const errors = useMemo((): FieldErrors => {
    const next: FieldErrors = {}
    const name = values.name.trim()

    if (!name) {
      next.name = 'Project name is required'
    } else if (name.length > PROJECT_NAME_MAX_LENGTH) {
      next.name = `Maximum ${PROJECT_NAME_MAX_LENGTH} characters`
    }

    if (values.description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
      next.description = `Maximum ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`
    }

    return next
  }, [values])

  const showError = (field: keyof FieldErrors): string | undefined => {
    if (serverFieldErrors[field]) return serverFieldErrors[field]
    if (!(submitAttempted || touched[field])) return undefined
    return errors[field]
  }

  const isFormValid =
    values.name.trim().length > 0 &&
    !errors.name &&
    !errors.description

  const update = <K extends keyof CreateProjectFormValues>(
    key: K,
    value: CreateProjectFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const buildCreateProjectKey = useCallback(
    (name: string): string => {
      const base = generateProjectKey(name) || 'PRJ'
      const normalizedExisting = new Set(projectKeys.map((key) => key.toUpperCase()))
      if (!normalizedExisting.has(base.toUpperCase())) return base

      for (let index = 2; index <= 9999; index += 1) {
        const candidate = `${base}${index}`.slice(0, 10)
        if (!normalizedExisting.has(candidate.toUpperCase())) return candidate
      }

      return `${base.slice(0, 7)}${Date.now().toString().slice(-3)}`.slice(0, 10)
    },
    [projectKeys],
  )

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    setSubmitError(null)
    setServerFieldErrors({})
    if (!isFormValid || submitting) return

    setSubmitting(true)
    try {
      const sprintWeeks =
        values.methodology === 'scrum' && values.sprintDuration !== 'custom'
          ? Number(values.sprintDuration)
          : undefined

      const projectName = values.name.trim()
      const project = await createProject({
        key: buildCreateProjectKey(projectName),
        slug: generateProjectSlug(projectName),
        name: projectName,
        description: values.description.trim(),
        methodology: values.methodology,
        ...(sprintWeeks !== undefined ? { default_sprint_weeks: sprintWeeks } : {}),
      })
      setSubmitting(false)
      onClose()
      if (onCreated) {
        onCreated(project.id)
      } else {
        navigate(projectOverviewPath(project.id))
      }
    } catch (error) {
      setSubmitting(false)
      if (error instanceof ApiError) {
        const nextFieldErrors: FieldErrors = {}
        if (error.errors?.name?.[0]) nextFieldErrors.name = error.errors.name[0]
        setServerFieldErrors(nextFieldErrors)
        setSubmitError(error.message)
        return
      }
      setSubmitError('Failed to create project. Please try again.')
    }
  }

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="rounded-lg border border-devflow-border bg-devflow-card px-4 py-2 text-btn text-devflow-text transition-colors hover:bg-devflow-surface disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isFormValid || submitting}
        className={cn(
          'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm transition-opacity',
          'hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Creating…
          </>
        ) : (
          'Create Project'
        )}
      </button>
    </div>
  )

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Create project"
      subtitle="Set up your workspace for boards, sprints, and team collaboration."
      footer={footer}
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        {submitError && (
          <p className="rounded-lg border border-devflow-error/30 bg-[var(--df-danger-tint)] px-3 py-2 text-body text-devflow-error">
            {submitError}
          </p>
        )}
        <FormSection title="Basic information">
          <FormField
            label="Project name"
            required
            value={values.name}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            placeholder="e.g. Mobile App, Backend API"
            error={showError('name')}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />

          <FormField
            label="Description"
            multiline
            rows={3}
            value={values.description}
            maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
            placeholder="Short summary of project goals…"
            error={showError('description')}
            onChange={(e) => update('description', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, description: true }))}
          />
        </FormSection>

        <FormSection title="Project setup">
          <RadioOptionGroup
            name="methodology"
            label="Methodology / workflow"
            value={values.methodology}
            onChange={(methodology) => update('methodology', methodology)}
            options={[
              {
                value: 'scrum',
                label: 'Scrum',
                description: 'Sprints, backlog, and velocity tracking',
              },
              {
                value: 'kanban',
                label: 'Kanban',
                description: 'Continuous flow board without sprints',
              },
            ]}
          />
        </FormSection>

        {values.methodology === 'scrum' && (
          <FormSection
            title="Sprint configuration"
            description="Defaults for new sprints in this project."
          >
            <SelectField
              label="Default sprint duration"
              value={values.sprintDuration}
              options={SPRINT_DURATION_OPTIONS}
              onChange={(e) =>
                update(
                  'sprintDuration',
                  e.target.value as CreateProjectFormValues['sprintDuration'],
                )
              }
            />
          </FormSection>
        )}
      </form>
    </DrawerPanel>
  )
}
