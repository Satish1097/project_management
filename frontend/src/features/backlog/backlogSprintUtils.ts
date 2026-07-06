import type { BacklogSprintMetadataApi } from '@/api/issues'
import type { Sprint, SprintStatus } from '@/types/sprints'
import { formatDateRange } from '@/utils/sprintDates'

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

export function mapBacklogSprintMetadataToUi(
  sprint: BacklogSprintMetadataApi,
  projectId: string,
): Sprint {
  const startDate = sprint.start_date ?? ''
  const endDate = sprint.end_date ?? ''

  return {
    id: sprint.id,
    projectId,
    name: sprint.name,
    status: mapStatus(sprint.status),
    startDate,
    endDate,
    dateRange:
      sprint.start_date && sprint.end_date
        ? formatDateRange(sprint.start_date, sprint.end_date)
        : '—',
    issueCount: sprint.issue_count,
    completedCount: 0,
    remainingCount: sprint.issue_count,
    inProgressCount: 0,
    progressPercentage: 0,
  }
}

export function sortSprintsForBacklog(sprints: Sprint[]): Sprint[] {
  const rank: Record<Sprint['status'], number> = {
    active: 0,
    planned: 1,
    paused: 2,
    completed: 3,
    cancelled: 4,
  }

  return [...sprints].sort((a, b) => {
    const statusDiff = rank[a.status] - rank[b.status]
    if (statusDiff !== 0) return statusDiff
    return a.startDate.localeCompare(b.startDate)
  })
}

export function defaultSprintCollapsed(sprint: Sprint): boolean {
  return sprint.status === 'completed' || sprint.status === 'cancelled'
}
