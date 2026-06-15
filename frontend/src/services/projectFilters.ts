import type { Project } from '@/types/projects'
import type { ProjectFilterId } from '@/components/ui/ProjectFilters'

export function filterProjects(
  projects: Project[],
  filter: ProjectFilterId,
): Project[] {
  switch (filter) {
    case 'all':
      return projects.filter((p) => p.status !== 'archived')
    case 'mine':
      return projects.filter((p) => p.isMember && p.status !== 'archived')
    case 'active':
      return projects.filter(
        (p) => p.status === 'active' || p.status === 'at_risk',
      )
    case 'planning':
      return projects.filter((p) => p.status === 'planning')
    case 'archived':
      return projects.filter((p) => p.status === 'archived')
    case 'favorites':
      return projects.filter((p) => p.isFavorite)
  }
}

export function sortProjectsByName(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => a.name.localeCompare(b.name))
}
