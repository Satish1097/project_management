import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DrawerPanel } from '@/components/ui/DrawerPanel'
import { FormField, FormSection } from '@/components/ui/FormField'
import { SelectField } from '@/components/ui/SelectField'
import { useSprints } from '@/contexts/SprintsContext'
import { buildSprintFromForm } from '@/services/buildSprintFromForm'
import {
  DEFAULT_CREATE_SPRINT_VALUES,
  type CreateSprintFormValues,
} from '@/types/createSprint'
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
}: CreateSprintDrawerProps) {
  const { addSprint } = useSprints()
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

  const reset = useCallback(() => {
    const start = toIsoDate(new Date())
    setValues({
      ...DEFAULT_CREATE_SPRINT_VALUES,
      name: suggestedName ?? '',
      startDate: start,
      endDate: endDateFromDuration(start, '2'),
    })
    setDurationManual(false)
    setTouched({})
    setSubmitAttempted(false)
    setSubmitting(false)
  }, [suggestedName])

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
    if (!isValid || submitting) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    const sprint = buildSprintFromForm(values, projectId)
    addSprint(sprint)
    setSubmitting(false)
    onClose()
    onCreated?.(sprint.id)
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
      title="Create sprint"
      subtitle="Plan the next iteration for your team."
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
