import { mockProjects } from '@/services/mockProjects'
import { mockSprints } from '@/services/mockSprints'
import type { Project } from '@/types/projects'
import type { Sprint } from '@/types/sprints'

export function getProjectById(projectId: string): Project | undefined {
  return mockProjects.find((p) => p.id === projectId)
}

export function getSprintsForProject(projectId: string): Sprint[] {
  return mockSprints.filter((s) => s.projectId === projectId)
}

export function getSprintById(
  projectId: string,
  sprintId: string,
): Sprint | undefined {
  return mockSprints.find(
    (s) => s.projectId === projectId && s.id === sprintId,
  )
}

export function getActiveSprint(projectId: string): Sprint | undefined {
  return getSprintsForProject(projectId).find((s) => s.status === 'active')
}

export function formatSprintStatus(status: Sprint['status']): string {
  switch (status) {
    case 'active':
      return 'Active Sprint'
    case 'planned':
      return 'Planned'
    case 'completed':
      return 'Completed'
  }
}

export function formatSprintStatusLabel(status: Sprint['status']): string {
  switch (status) {
    case 'active':
      return 'Active'
    case 'planned':
      return 'Planned'
    case 'completed':
      return 'Completed'
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

export function getTeamCount(project: Project): number {
  return project.members.length + (project.extraMembers ?? 0)
}
