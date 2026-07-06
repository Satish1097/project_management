import type { Sprint } from '@/types/sprints'
import { formatDateRange } from '@/utils/sprintDates'

let sprints: Sprint[] = []

function hydrate(sprint: Sprint): Sprint {
  return {
    ...sprint,
    dateRange: formatDateRange(sprint.startDate, sprint.endDate),
  }
}

export function getSprints(): Sprint[] {
  return sprints.map(hydrate)
}

export function getSprintsForProjectRegistry(projectId: string): Sprint[] {
  return getSprints().filter((s) => s.projectId === projectId)
}

export function getSprintByIdRegistry(
  projectId: string,
  sprintId: string,
): Sprint | undefined {
  return getSprints().find(
    (s) => s.projectId === projectId && s.id === sprintId,
  )
}

export function addSprintToRegistry(sprint: Sprint): void {
  sprints = [...sprints, hydrate(sprint)]
}

export function updateSprintInRegistry(
  sprintId: string,
  patch: Partial<Sprint>,
): void {
  sprints = sprints.map((s) =>
    s.id === sprintId ? hydrate({ ...s, ...patch }) : s,
  )
}

export function replaceSprintsForProject(
  projectId: string,
  next: Sprint[],
): void {
  sprints = [
    ...sprints.filter((s) => s.projectId !== projectId),
    ...next.map(hydrate),
  ]
}

export function upsertSprintInRegistry(sprint: Sprint): void {
  const index = sprints.findIndex((s) => s.id === sprint.id)
  const hydrated = hydrate(sprint)
  if (index < 0) {
    sprints = [...sprints, hydrated]
    return
  }
  sprints = [
    ...sprints.slice(0, index),
    hydrated,
    ...sprints.slice(index + 1),
  ]
}
