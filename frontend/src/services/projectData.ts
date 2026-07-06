import { getProjectByIdFromRegistry } from '@/services/projectsRegistry'
import {
  getSprintByIdRegistry,
  getSprintsForProjectRegistry,
} from '@/services/sprintsRegistry'
import type { Project } from '@/types/projects'
import type { Sprint, SprintStatus } from '@/types/sprints'

export type SprintIssueStats = {
  completed: number
  remaining: number
  inProgress: number
}

export function getSprintIssueStats(sprint: Sprint): SprintIssueStats {
  return {
    completed: sprint.completedCount,
    remaining: sprint.remainingCount,
    inProgress: sprint.inProgressCount,
  }
}

export function getProjectById(projectId: string): Project | undefined {
  return getProjectByIdFromRegistry(projectId)
}

export function getSprintsForProject(projectId: string): Sprint[] {
  return getSprintsForProjectRegistry(projectId)
}

export function getSprintById(
  projectId: string,
  sprintId: string,
): Sprint | undefined {
  return getSprintByIdRegistry(projectId, sprintId)
}

/** All active sprints for a project (Parallel Sprints: may be more than one). */
export function getActiveSprints(projectId: string): Sprint[] {
  return getSprintsForProject(projectId).filter((s) => s.status === 'active')
}

/**
 * One active sprint (first match), or undefined.
 *
 * Parallel Sprints: a project can have multiple active sprints; prefer
 * `getActiveSprints` when all of them matter. Retained for callers that only
 * need a representative sprint.
 */
export function getActiveSprint(projectId: string): Sprint | undefined {
  return getActiveSprints(projectId)[0]
}

export function formatSprintStatus(status: SprintStatus): string {
  switch (status) {
    case 'active':
      return 'Active Sprint'
    case 'planned':
      return 'Planned'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    case 'paused':
      return 'Paused'
  }
}

export function formatSprintStatusLabel(status: SprintStatus): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'planned':
      return 'Planned'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    case 'paused':
      return 'Paused'
  }
}

export function getSprintDaysRemaining(sprint: Sprint): number | undefined {
  if (sprint.status !== 'active' || sprint.daysRemaining == null) {
    return undefined
  }
  return sprint.daysRemaining
}

export function formatSprintMetaLine(sprint: Sprint): string {
  const parts = [sprint.name, formatSprintStatusLabel(sprint.status)]
  const days = getSprintDaysRemaining(sprint)
  if (days != null) {
    parts.push(`${days} days left`)
  }
  return parts.join(' • ')
}

export function getSprintCompletionPercent(sprint: Sprint): number {
  return sprint.progressPercentage
}

export function getSprintSuccessRate(sprint: Sprint): number {
  return sprint.progressPercentage
}

