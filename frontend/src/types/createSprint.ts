import type { SprintDurationWeeks, SprintStatus } from '@/types/sprints'

export type CreateSprintFormValues = {
  name: string
  goal: string
  startDate: string
  endDate: string
  durationWeeks: SprintDurationWeeks
  capacityPoints: string
  status: SprintStatus
}

export const DEFAULT_CREATE_SPRINT_VALUES: CreateSprintFormValues = {
  name: '',
  goal: '',
  startDate: '',
  endDate: '',
  durationWeeks: '2',
  capacityPoints: '',
  status: 'planned',
}
