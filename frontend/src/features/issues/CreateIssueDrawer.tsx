import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DrawerPanel } from '@/components/ui/DrawerPanel'
import { FormField, FormSection } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/SelectField'
import { AssigneeSelect } from '@/components/issues/AssigneeSelect'
import { AttachmentDropzone } from '@/components/issues/AttachmentDropzone'
import { IssuePrioritySelect } from '@/components/issues/IssuePrioritySelect'
import { IssueTypeSelect } from '@/components/issues/IssueTypeSelect'
import { LabelMultiSelect } from '@/components/issues/LabelMultiSelect'
import { CURRENT_USER } from '@/constants/currentUser'
import {
  ISSUE_COMPONENT_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  STORY_POINT_OPTIONS,
} from '@/constants/issueOptions'
import { useIssues } from '@/contexts/IssuesContext'
import { useProjects } from '@/contexts/ProjectsContext'
import { buildIssueFromForm } from '@/services/buildIssueFromForm'
import { formatSprintStatusLabel, getSprintsForProject } from '@/services/projectData'
import {
  DEFAULT_CREATE_ISSUE_VALUES,
  ISSUE_ACCEPTANCE_MAX_LENGTH,
  ISSUE_DESCRIPTION_MAX_LENGTH,
  ISSUE_TITLE_MAX_LENGTH,
  type CreateIssueFormValues,
} from '@/types/createIssue'
import type { IssueAttachment } from '@/types/issues'
import type { CreateIssueDefaults } from '@/utils/resolveCreateIssueContext'
import { cn } from '@/utils/cn'

type CreateIssueDrawerProps = {
  open: boolean
  onClose: () => void
  defaults: CreateIssueDefaults
}

type PendingAttachment = IssueAttachment & { file?: File }

type FieldErrors = Partial<Record<'title' | 'projectId', string>>

const NO_SPRINT = ''

function buildInitialValues(defaults: CreateIssueDefaults): CreateIssueFormValues {
  const sprintId =
    defaults.source === 'board' && defaults.sprintId
      ? defaults.sprintId
      : defaults.sprintId === null || defaults.source === 'backlog'
        ? NO_SPRINT
        : defaults.sprintId ?? NO_SPRINT

  return {
    ...DEFAULT_CREATE_ISSUE_VALUES,
    projectId: defaults.projectId ?? '',
    sprintId,
    reporterId: CURRENT_USER.id,
    status: defaults.source === 'board' ? 'todo' : 'backlog',
  }
}

export function CreateIssueDrawer({
  open,
  onClose,
  defaults,
}: CreateIssueDrawerProps) {
  const { projects } = useProjects()
  const { addIssue } = useIssues()
  const [values, setValues] = useState<CreateIssueFormValues>(() =>
    buildInitialValues(defaults),
  )
  const [attachments, setAttachments] = useState<PendingAttachment[]>([])
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [addAnother, setAddAnother] = useState(false)

  const reset = useCallback(() => {
    setValues(buildInitialValues(defaults))
    setAttachments([])
    setTouched({})
    setSubmitAttempted(false)
    setSubmitting(false)
  }, [defaults])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const sprintOptions = useMemo(() => {
    if (!values.projectId) return [{ value: NO_SPRINT, label: 'No Sprint (Backlog)' }]
    const sprints = getSprintsForProject(values.projectId).filter(
      (s) => s.status === 'active' || s.status === 'planned' || s.status === 'paused',
    )
    return [
      { value: NO_SPRINT, label: 'No Sprint (Backlog)' },
      ...sprints.map((s) => ({
        value: s.id,
        label: `${s.name} (${formatSprintStatusLabel(s.status)})`,
      })),
    ]
  }, [values.projectId])

  const errors = useMemo((): FieldErrors => {
    const next: FieldErrors = {}
    if (!values.title.trim()) next.title = 'Issue title is required'
    else if (values.title.length > ISSUE_TITLE_MAX_LENGTH) {
      next.title = `Maximum ${ISSUE_TITLE_MAX_LENGTH} characters`
    }
    if (!values.projectId) next.projectId = 'Project is required'
    return next
  }, [values])

  const showError = (field: keyof FieldErrors) => {
    if (!(submitAttempted || touched[field])) return undefined
    return errors[field]
  }

  const isValid =
    values.title.trim().length > 0 &&
    values.projectId.length > 0 &&
    !errors.title &&
    !errors.projectId

  const update = <K extends keyof CreateIssueFormValues>(
    key: K,
    value: CreateIssueFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }))

  const submit = async (keepOpen: boolean) => {
    setSubmitAttempted(true)
    if (!isValid || submitting) return

    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 550))

    const issue = buildIssueFromForm(
      values,
      attachments.map(({ id, name, size, mimeType, previewUrl }) => ({
        id,
        name,
        size,
        mimeType,
        previewUrl,
      })),
    )
    addIssue(issue)
    setSubmitting(false)

    if (keepOpen) {
      setValues({
        ...buildInitialValues(defaults),
        projectId: values.projectId,
        sprintId: values.sprintId,
        reporterId: CURRENT_USER.id,
      })
      setAttachments([])
      setSubmitAttempted(false)
      setTouched({})
      return
    }

    onClose()
  }

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="order-2 rounded-lg border border-devflow-border bg-devflow-card px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50 sm:order-1"
      >
        Cancel
      </button>
      <div className="order-1 flex flex-wrap justify-end gap-2 sm:order-2">
        <button
          type="button"
          disabled={!isValid || submitting}
          onClick={() => {
            setAddAnother(true)
            void submit(true)
          }}
          className="rounded-lg border border-devflow-border px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
        >
          Create & add another
        </button>
        <button
          type="button"
          disabled={!isValid || submitting}
          onClick={() => {
            setAddAnother(false)
            void submit(false)
          }}
          className={cn(
            'inline-flex min-w-[7.5rem] items-center justify-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {submitting && !addAnother ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            'Create Issue'
          )}
        </button>
      </div>
    </div>
  )

  const requireProject = defaults.source === 'global' && !defaults.projectId

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title="Create issue"
      subtitle="Add work to backlog or a sprint without leaving your current view."
      footer={footer}
      size="wide"
    >
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          void submit(false)
        }}
      >
        <FormSection title="Basic information">
          <FormField
            label="Issue title"
            required
            value={values.title}
            maxLength={ISSUE_TITLE_MAX_LENGTH}
            placeholder="Enter issue title"
            error={showError('title')}
            onChange={(e) => update('title', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
          />
          <FormField
            label="Description"
            multiline
            rows={5}
            value={values.description}
            maxLength={ISSUE_DESCRIPTION_MAX_LENGTH}
            placeholder="Describe the issue. Markdown supported (rendering coming soon)."
            hint="Use bullet points, links, and code blocks in plain text for now."
            onChange={(e) => update('description', e.target.value)}
          />
        </FormSection>

        <FormSection title="Classification">
          <IssueTypeSelect
            value={values.issueType}
            onChange={(issueType) => update('issueType', issueType)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <IssuePrioritySelect
              value={values.priority}
              onChange={(priority) => update('priority', priority)}
            />
            <SelectField
              label="Status"
              value={values.status}
              options={ISSUE_STATUS_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onChange={(e) =>
                update(
                  'status',
                  e.target.value as CreateIssueFormValues['status'],
                )
              }
            />
          </div>
          <LabelMultiSelect
            selected={values.labels}
            onChange={(labels) => update('labels', labels)}
          />
        </FormSection>

        <FormSection title="Project context">
          <SelectField
            label="Project"
            required
            value={values.projectId}
            error={showError('projectId')}
            options={[
              { value: '', label: requireProject ? 'Select project…' : '—' },
              ...projects.map((p) => ({
                value: p.id,
                label: p.name,
              })),
            ]}
            onChange={(e) => {
              update('projectId', e.target.value)
              update('sprintId', NO_SPRINT)
            }}
            onBlur={() => setTouched((t) => ({ ...t, projectId: true }))}
          />
          <SelectField
            label="Sprint (optional)"
            value={values.sprintId}
            disabled={!values.projectId}
            hint="Leave empty to keep issue in backlog."
            options={sprintOptions}
            onChange={(e) => update('sprintId', e.target.value)}
          />
        </FormSection>

        <FormSection title="Assignment">
          <AssigneeSelect
            value={values.assigneeId}
            onChange={(assigneeId) => update('assigneeId', assigneeId)}
          />
          <FormField
            label="Reporter"
            value={CURRENT_USER.name}
            readOnly
            disabled
            hint="Auto-filled as the current user."
          />
          <SelectField
            label="Team / component"
            value={values.component}
            options={[
              { value: '', label: 'None' },
              ...ISSUE_COMPONENT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
            onChange={(e) =>
              update('component', e.target.value as CreateIssueFormValues['component'])
            }
          />
        </FormSection>

        <FormSection title="Planning">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="Story points"
              value={values.storyPoints}
              options={[
                { value: '', label: 'None' },
                ...STORY_POINT_OPTIONS.map((p) => ({ value: p, label: p })),
              ]}
              onChange={(e) => update('storyPoints', e.target.value)}
            />
            <FormField
              label="Due date"
              type="date"
              value={values.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
            />
          </div>
          <FormField
            label="Estimated time"
            value={values.estimatedTime}
            placeholder="2h, 1 day, 3 days"
            onChange={(e) => update('estimatedTime', e.target.value)}
          />
        </FormSection>

        <FormSection title="Acceptance criteria">
          <FormField
            label="Acceptance criteria"
            multiline
            rows={4}
            value={values.acceptanceCriteria}
            maxLength={ISSUE_ACCEPTANCE_MAX_LENGTH}
            placeholder="- Login works correctly&#10;- API response &lt; 500ms"
            onChange={(e) => update('acceptanceCriteria', e.target.value)}
          />
        </FormSection>

        <AttachmentDropzone
          attachments={attachments}
          onChange={setAttachments}
        />
      </form>
    </DrawerPanel>
  )
}
