import type { CreateSprintFormValues } from '@/types/createSprint'
import type { Sprint } from '@/types/sprints'
import {
  computeDaysRemaining,
  formatDateRange,
} from '@/utils/sprintDates'

export function buildSprintFromForm(
  values: CreateSprintFormValues,
  projectId: string,
): Sprint {
  const id = `sprint-${Date.now()}`
  return {
    id,
    projectId,
    name: values.name.trim(),
    goal: values.goal.trim() || undefined,
    status: values.status,
    startDate: values.startDate,
    endDate: values.endDate,
    dateRange: formatDateRange(values.startDate, values.endDate),
    issueCount: 0,
    completedCount: 0,
    remainingCount: 0,
    inProgressCount: 0,
    progressPercentage: 0,
    capacityPoints: values.capacityPoints
      ? Number(values.capacityPoints)
      : undefined,
    durationWeeks: values.durationWeeks,
    daysRemaining:
      values.status === 'active'
        ? computeDaysRemaining(values.endDate)
        : undefined,
  }
}
