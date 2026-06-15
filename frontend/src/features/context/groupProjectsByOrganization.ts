import type { ContextOrganization, ContextProject } from './types'

/**
 * The context API returns a flat project list ordered by organization.
 * Slice using each org's project_count to recover per-org groupings.
 */
export function groupProjectsByOrganization(
  organizations: ContextOrganization[],
  projects: ContextProject[],
): Map<string, ContextProject[]> {
  const grouped = new Map<string, ContextProject[]>()
  let index = 0

  for (const organization of organizations) {
    const orgProjects = projects.slice(index, index + organization.project_count)
    grouped.set(organization.id, orgProjects)
    index += organization.project_count
  }

  return grouped
}

export function getProjectsForOrganization(
  organizationId: string,
  organizations: ContextOrganization[],
  projects: ContextProject[],
): ContextProject[] {
  return groupProjectsByOrganization(organizations, projects).get(organizationId) ?? []
}
