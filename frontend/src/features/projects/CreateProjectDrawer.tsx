import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DrawerPanel } from '@/components/ui/DrawerPanel'
import { FormField, FormSection } from '@/components/ui/FormField'
import { RadioOptionGroup } from '@/components/ui/RadioOptionGroup'
import { SelectField } from '@/components/ui/SelectField'
import { UserMultiSelect } from '@/components/ui/UserMultiSelect'
import { UserSelectField } from '@/components/ui/UserSelectField'
import { projectOverviewPath } from '@/constants/routes'
import { CURRENT_USER } from '@/constants/currentUser'
import { useProjects } from '@/contexts/ProjectsContext'
import { buildProjectFromForm } from '@/services/buildProjectFromForm'
import { mockMembers } from '@/services/mockMembers'
import {
  DEFAULT_CREATE_PROJECT_VALUES,
  type CreateProjectFormValues,
} from '@/types/createProject'
import {
  generateProjectKey,
  isProjectKeyTaken,
  isValidProjectKey,
  normalizeProjectKey,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_KEY_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from '@/utils/projectKey'
import { cn } from '@/utils/cn'

type CreateProjectDrawerProps = {
  open: boolean
  onClose: () => void
}

type FieldErrors = Partial<Record<'name' | 'key' | 'description', string>>

const PROJECT_TYPE_OPTIONS = [
  { value: 'software', label: 'Software Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'operations', label: 'Operations' },
  { value: 'custom', label: 'Custom' },
] as const

const SPRINT_DURATION_OPTIONS = [
  { value: '1', label: '1 Week' },
  { value: '2', label: '2 Weeks' },
  { value: '3', label: '3 Weeks' },
  { value: '4', label: '4 Weeks' },
  { value: 'custom', label: 'Custom' },
]

export function CreateProjectDrawer({ open, onClose }: CreateProjectDrawerProps) {
  const navigate = useNavigate()
  const { addProject, projectKeys } = useProjects()

  const [values, setValues] = useState<CreateProjectFormValues>(() => ({
    ...DEFAULT_CREATE_PROJECT_VALUES,
    leadId: CURRENT_USER.id,
  }))
  const [keyTouched, setKeyTouched] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const resetForm = useCallback(() => {
    setValues({
      ...DEFAULT_CREATE_PROJECT_VALUES,
      leadId: CURRENT_USER.id,
    })
    setKeyTouched(false)
    setTouched({})
    setSubmitAttempted(false)
    setSubmitting(false)
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

    if (!values.key) {
      next.key = 'Project key is required'
    } else if (!isValidProjectKey(values.key)) {
      next.key = 'Use 2–10 uppercase letters or numbers'
    } else if (isProjectKeyTaken(values.key, projectKeys)) {
      next.key = 'This key is already in use'
    }

    if (values.description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
      next.description = `Maximum ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`
    }

    return next
  }, [values, projectKeys])

  const showError = (field: keyof FieldErrors): string | undefined => {
    if (!(submitAttempted || touched[field])) return undefined
    return errors[field]
  }

  const isFormValid =
    values.name.trim().length > 0 &&
    values.key.length > 0 &&
    !errors.name &&
    !errors.key &&
    !errors.description

  const update = <K extends keyof CreateProjectFormValues>(
    key: K,
    value: CreateProjectFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleNameChange = (name: string) => {
    update('name', name)
    if (!keyTouched) {
      update('key', generateProjectKey(name))
    }
  }

  const handleKeyChange = (raw: string) => {
    setKeyTouched(true)
    update('key', normalizeProjectKey(raw))
  }

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    if (!isFormValid || submitting) return

    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 700))

    const project = buildProjectFromForm(values)
    addProject(project)
    setSubmitting(false)
    onClose()
    navigate(projectOverviewPath(project.id))
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
        <FormSection title="Basic information">
          <FormField
            label="Project name"
            required
            value={values.name}
            maxLength={PROJECT_NAME_MAX_LENGTH}
            placeholder="e.g. Mobile App, Backend API"
            error={showError('name')}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />

          <FormField
            label="Project key"
            required
            value={values.key}
            maxLength={PROJECT_KEY_MAX_LENGTH}
            placeholder="MOB"
            hint="Used in issue IDs (e.g. MOB-101). Auto-generated from name."
            error={showError('key')}
            className="[&_input]:font-mono [&_input]:tracking-wide"
            onChange={(e) => handleKeyChange(e.target.value)}
            onBlur={() => {
              setKeyTouched(true)
              setTouched((t) => ({ ...t, key: true }))
            }}
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
          <SelectField
            label="Project type"
            value={values.projectType}
            options={PROJECT_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(e) =>
              update(
                'projectType',
                e.target.value as CreateProjectFormValues['projectType'],
              )
            }
          />

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

          <RadioOptionGroup
            name="visibility"
            label="Project visibility"
            value={values.visibility}
            onChange={(visibility) => update('visibility', visibility)}
            options={[
              {
                value: 'private',
                label: 'Private',
                description: 'Only invited members',
              },
              {
                value: 'workspace',
                label: 'Workspace visible',
                description: 'Anyone in the workspace can view',
              },
            ]}
          />
        </FormSection>

        <FormSection title="Team">
          <UserSelectField
            label="Project lead"
            users={mockMembers}
            value={values.leadId}
            onChange={(leadId) => update('leadId', leadId)}
          />

          <UserMultiSelect
            label="Team members"
            hint="Optional — invite collaborators now or add them later."
            users={mockMembers}
            selectedIds={values.memberIds}
            excludeIds={[values.leadId]}
            onChange={(memberIds) => update('memberIds', memberIds)}
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
