import { getProjectByIdFromRegistry } from '@/services/projectsRegistry'
import {
  getSprintByIdRegistry,
  getSprintsForProjectRegistry,
} from '@/services/sprintsRegistry'
import type { Project } from '@/types/projects'
import type { Sprint, SprintStatus } from '@/types/sprints'
import { computeSprintProgress } from '@/utils/sprintDates'

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

export function getActiveSprint(projectId: string): Sprint | undefined {
  return getSprintsForProject(projectId).find((s) => s.status === 'active')
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
  return computeSprintProgress(sprint.completedCount, sprint.issueCount)
}

export function getSprintSuccessRate(sprint: Sprint): number {
  if (sprint.issueCount === 0) return 0
  return computeSprintProgress(sprint.completedCount, sprint.issueCount)
}

export function getTeamCount(project: Project): number {
  return project.members.length + (project.extraMembers ?? 0)
}
