import type { SprintDetailApi, SprintSummaryApi } from '@/api/sprints'
import type { Sprint, SprintStatus } from '@/types/sprints'
import { computeDaysRemaining, formatDateRange } from '@/utils/sprintDates'

function mapStatus(status: string): SprintStatus {
  if (
    status === 'active' ||
    status === 'completed' ||
    status === 'planned' ||
    status === 'paused' ||
    status === 'cancelled'
  ) {
    return status
  }
  return 'planned'
}

function formatRange(startDate: string | null, endDate: string | null): string {
  if (startDate && endDate) {
    return formatDateRange(startDate, endDate)
  }
  return '—'
}

export function mapSprintSummaryToUi(
  sprint: SprintSummaryApi,
  projectId?: string,
): Sprint {
  const startDate = sprint.start_date ?? ''
  const endDate = sprint.end_date ?? ''

  return {
    id: sprint.id,
    projectId: sprint.project_id ?? projectId ?? '',
    name: sprint.name,
    status: mapStatus(sprint.status),
    startDate,
    endDate,
    dateRange: formatRange(sprint.start_date, sprint.end_date),
    issueCount: 0,
    completedCount: 0,
    capacityPoints: sprint.capacity_points ?? undefined,
  }
}

export function mapSprintDetailToUi(
  sprint: SprintDetailApi,
  projectId?: string,
): Sprint {
  const base = mapSprintSummaryToUi(sprint, projectId)

  return {
    ...base,
    goal: sprint.goal?.trim() || undefined,
    daysRemaining:
      base.status === 'active' && sprint.end_date
        ? computeDaysRemaining(sprint.end_date)
        : undefined,
  }
}
