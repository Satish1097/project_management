import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DrawerPanel } from '@/components/ui/DrawerPanel'
import { FormField, FormSection } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/SelectField'
import { ApiError } from '@/api/types'
import { useSprints } from '@/contexts/SprintsContext'
import {
  DEFAULT_CREATE_SPRINT_VALUES,
  type CreateSprintFormValues,
} from '@/types/createSprint'
import type { Sprint } from '@/types/sprints'
import {
  durationWeeksFromDates,
  endDateFromDuration,
  isEndAfterStart,
  toIsoDate,
} from '@/utils/sprintDates'
import { cn } from '@/utils/cn'

const SPRINT_NAME_MAX = 80
const GOAL_MAX = 500

const DURATION_OPTIONS = [
  { value: '1', label: '1 Week' },
  { value: '2', label: '2 Weeks' },
  { value: '3', label: '3 Weeks' },
  { value: '4', label: '4 Weeks' },
  { value: 'custom', label: 'Custom' },
]

const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

type CreateSprintDrawerProps = {
  open: boolean
  onClose: () => void
  projectId: string
  onCreated?: (sprintId: string) => void
  /** Pre-fill name suggestion e.g. Sprint 44 */
  suggestedName?: string
  /** When set, drawer edits an existing sprint via PATCH. */
  sprintToEdit?: Sprint
}

type FieldErrors = Partial<
  Record<'name' | 'startDate' | 'endDate' | 'capacityPoints', string>
>

export function CreateSprintDrawer({
  open,
  onClose,
  projectId,
  onCreated,
  suggestedName,
  sprintToEdit,
}: CreateSprintDrawerProps) {
  const { createSprintViaApi, updateSprintViaApi } = useSprints()
  const isEdit = Boolean(sprintToEdit)
  const [values, setValues] = useState<CreateSprintFormValues>(() => ({
    ...DEFAULT_CREATE_SPRINT_VALUES,
    name: suggestedName ?? '',
    startDate: toIsoDate(new Date()),
    endDate: endDateFromDuration(toIsoDate(new Date()), '2'),
  }))
  const [durationManual, setDurationManual] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const reset = useCallback(() => {
    const start = sprintToEdit?.startDate || toIsoDate(new Date())
    setValues({
      ...DEFAULT_CREATE_SPRINT_VALUES,
      name: sprintToEdit?.name ?? suggestedName ?? '',
      goal: sprintToEdit?.goal ?? '',
      startDate: start,
      endDate:
        sprintToEdit?.endDate || endDateFromDuration(start, '2'),
      durationWeeks:
        sprintToEdit?.startDate && sprintToEdit?.endDate
          ? durationWeeksFromDates(sprintToEdit.startDate, sprintToEdit.endDate)
          : '2',
      status: sprintToEdit?.status ?? 'planned',
      capacityPoints: sprintToEdit?.capacityPoints
        ? String(sprintToEdit.capacityPoints)
        : '',
    })
    setDurationManual(false)
    setTouched({})
    setSubmitAttempted(false)
    setSubmitting(false)
    setSubmitError(null)
  }, [suggestedName, sprintToEdit])

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  const errors = useMemo((): FieldErrors => {
    const next: FieldErrors = {}
    if (!values.name.trim()) next.name = 'Sprint name is required'
    else if (values.name.length > SPRINT_NAME_MAX) {
      next.name = `Maximum ${SPRINT_NAME_MAX} characters`
    }
    if (!values.startDate) next.startDate = 'Start date is required'
    if (!values.endDate) next.endDate = 'End date is required'
    if (
      values.startDate &&
      values.endDate &&
      !isEndAfterStart(values.startDate, values.endDate)
    ) {
      next.endDate = 'End date must be after start date'
    }
    if (values.capacityPoints && Number.isNaN(Number(values.capacityPoints))) {
      next.capacityPoints = 'Enter a valid number'
    }
    return next
  }, [values])

  const showError = (field: keyof FieldErrors) => {
    if (!(submitAttempted || touched[field])) return undefined
    return errors[field]
  }

  const isValid =
    values.name.trim().length > 0 &&
    values.startDate &&
    values.endDate &&
    !errors.name &&
    !errors.startDate &&
    !errors.endDate &&
    !errors.capacityPoints

  const update = <K extends keyof CreateSprintFormValues>(
    key: K,
    value: CreateSprintFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: value }))

  const handleDurationChange = (weeks: CreateSprintFormValues['durationWeeks']) => {
    setDurationManual(false)
    update('durationWeeks', weeks)
    if (weeks !== 'custom' && values.startDate) {
      update('endDate', endDateFromDuration(values.startDate, weeks))
    } else {
      setDurationManual(true)
    }
  }

  const handleStartChange = (startDate: string) => {
    update('startDate', startDate)
    if (!durationManual && values.durationWeeks !== 'custom') {
      update('endDate', endDateFromDuration(startDate, values.durationWeeks))
    }
  }

  const handleEndChange = (endDate: string) => {
    setDurationManual(true)
    update('endDate', endDate)
    if (values.startDate && isEndAfterStart(values.startDate, endDate)) {
      update('durationWeeks', durationWeeksFromDates(values.startDate, endDate))
    }
  }

  const handleSubmit = async () => {
    setSubmitAttempted(true)
    setSubmitError(null)
    if (!isValid || submitting) return
    setSubmitting(true)

    const payload = {
      name: values.name.trim(),
      goal: values.goal.trim(),
      start_date: values.startDate,
      end_date: values.endDate,
      capacity_points:
        values.capacityPoints.trim() === ''
          ? null
          : Number(values.capacityPoints),
    }

    try {
      if (isEdit && sprintToEdit) {
        await updateSprintViaApi(sprintToEdit.id, projectId, payload)
        onClose()
        return
      }

      const sprint = await createSprintViaApi(projectId, payload)
      onClose()
      onCreated?.(sprint.id)
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : 'Failed to save sprint.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const footer = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        disabled={submitting}
        className="rounded-lg border border-devflow-border bg-devflow-card px-4 py-2 text-btn text-devflow-text hover:bg-devflow-surface disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!isValid || submitting}
        className={cn(
          'inline-flex min-w-[8rem] items-center justify-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating…
          </>
        ) : isEdit ? (
          'Save changes'
        ) : (
          'Create Sprint'
        )}
      </button>
    </div>
  )

  return (
    <DrawerPanel
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit sprint' : 'Create sprint'}
      subtitle={
        isEdit
          ? 'Update sprint details for your team.'
          : 'Plan the next iteration for your team.'
      }
      footer={footer}
    >
      {submitError && (
        <p className="mb-4 rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
          {submitError}
        </p>
      )}
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault()
          void handleSubmit()
        }}
      >
        <FormSection title="Basic information">
          <FormField
            label="Sprint name"
            required
            value={values.name}
            maxLength={SPRINT_NAME_MAX}
            placeholder="Sprint 42, Authentication Sprint…"
            error={showError('name')}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          />
          <FormField
            label="Sprint goal"
            multiline
            rows={3}
            value={values.goal}
            maxLength={GOAL_MAX}
            placeholder="What should this sprint achieve?"
            onChange={(e) => update('goal', e.target.value)}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Start date"
              required
              type="date"
              value={values.startDate}
              error={showError('startDate')}
              onChange={(e) => handleStartChange(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, startDate: true }))}
            />
            <FormField
              label="End date"
              required
              type="date"
              value={values.endDate}
              error={showError('endDate')}
              onChange={(e) => handleEndChange(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, endDate: true }))}
            />
          </div>
          <SelectField
            label="Sprint duration"
            value={values.durationWeeks}
            options={DURATION_OPTIONS}
            hint="Adjusts end date unless custom."
            onChange={(e) =>
              handleDurationChange(
                e.target.value as CreateSprintFormValues['durationWeeks'],
              )
            }
          />
          <FormField
            label="Sprint capacity"
            type="number"
            min={0}
            value={values.capacityPoints}
            placeholder="40"
            hint="Optional story points capacity."
            error={showError('capacityPoints')}
            onChange={(e) => update('capacityPoints', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, capacityPoints: true }))}
          />
          <SelectField
            label="Status"
            value={values.status}
            options={STATUS_OPTIONS}
            onChange={(e) =>
              update('status', e.target.value as CreateSprintFormValues['status'])
            }
          />
        </FormSection>
      </form>
    </DrawerPanel>
  )
}
