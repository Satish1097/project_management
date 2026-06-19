import { getSprintIssues } from '@/services/issuesRegistry'
import { getProjectByIdFromRegistry } from '@/services/projectsRegistry'
import {
  getSprintByIdRegistry,
  getSprintsForProjectRegistry,
} from '@/services/sprintsRegistry'
import type { Project } from '@/types/projects'
import { mapWorkflowToBoardStatus, type ProjectIssue } from '@/types/issues'
import type { Sprint, SprintStatus } from '@/types/sprints'
import { computeSprintProgress } from '@/utils/sprintDates'

export type SprintIssueStats = {
  completed: number
  remaining: number
  inProgress: number
}

function isIssueInProgress(issue: ProjectIssue): boolean {
  if (issue.status === 'in_progress') return true
  if (issue.workflowStatus) {
    return mapWorkflowToBoardStatus(issue.workflowStatus) === 'in_progress'
  }
  return false
}

function isIssueCompleted(issue: ProjectIssue): boolean {
  return issue.done === true || issue.status === 'done'
}

export function getSprintIssueStats(sprint: Sprint): SprintIssueStats {
  const issues = getSprintIssues(sprint.projectId, sprint.id)
  if (issues.length > 0) {
    const completed = issues.filter(isIssueCompleted).length
    const inProgress = issues.filter(isIssueInProgress).length
    return {
      completed,
      inProgress,
      remaining: issues.length - completed,
    }
  }

  const completed = sprint.completedCount
  return {
    completed,
    inProgress: 0,
    remaining: Math.max(0, sprint.issueCount - completed),
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
