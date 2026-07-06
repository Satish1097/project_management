import { Link, useLocation, useParams } from 'react-router-dom'
import {
  isProjectBoardPath,
  projectActivityPath,
  projectBacklogPath,
  projectBoardPath,
  projectOverviewPath,
  projectReleasesPath,
  projectReportsPath,
  projectSettingsGeneralPath,
  projectSettingsPath,
  projectSprintsPath,
  projectTeamPath,
} from '@/constants/routes'
import { useProjectMethodology } from '@/hooks/useProjectMethodology'
import type { ProjectMethodology } from '@/types/projects'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Overview', segment: '' },
  { label: 'Backlog', segment: 'backlog' },
  { label: 'Board', segment: 'board' },
  { label: 'Sprints', segment: 'sprints' },
  { label: 'Activity', segment: 'activity' },
  { label: 'Reports', segment: 'reports' },
  { label: 'Releases', segment: 'releases' },
  { label: 'Team', segment: 'team' },
  { label: 'Settings', segment: 'settings' },
] as const

type NavSegment = (typeof navItems)[number]['segment']

const SCRUM_ONLY_SEGMENTS = new Set<NavSegment>(['backlog', 'sprints'])

function getNavItemsForMethodology(methodology: ProjectMethodology) {
  if (methodology === 'kanban') {
    return navItems.filter((item) => !SCRUM_ONLY_SEGMENTS.has(item.segment))
  }
  return navItems
}

export function ProjectNav() {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()
  const { methodology } = useProjectMethodology(projectId)
  const visibleNavItems = getNavItemsForMethodology(methodology)

  const pathFor = (segment: NavSegment) => {
    switch (segment) {
      case '':
        return projectOverviewPath(projectId)
      case 'board':
        return projectBoardPath(projectId)
      case 'activity':
        return projectActivityPath(projectId)
      case 'backlog':
        return projectBacklogPath(projectId)
      case 'sprints':
        return projectSprintsPath(projectId)
      case 'team':
        return projectTeamPath(projectId)
      case 'releases':
        return projectReleasesPath(projectId)
      case 'reports':
        return projectReportsPath(projectId)
      case 'settings':
        return projectSettingsGeneralPath(projectId)
    }
  }

  const isActive = (segment: NavSegment) => {
    const base = projectOverviewPath(projectId)
    if (segment === '') {
      return pathname === base
    }
    if (segment === 'board') {
      return isProjectBoardPath(pathname)
    }
    if (segment === 'activity') {
      return pathname === projectActivityPath(projectId)
    }
    if (segment === 'sprints') {
      return /\/projects\/[^/]+\/sprints/.test(pathname)
    }
    if (segment === 'settings') {
      return pathname.startsWith(projectSettingsPath(projectId))
    }
    return pathname.startsWith(pathFor(segment))
  }

  return (
    <nav
      className="-mb-px flex items-center gap-0.5 overflow-x-auto border-t border-devflow-border/60 px-4"
      aria-label="Project navigation"
    >
      {visibleNavItems.map(({ label, segment }) => (
        <Link
          key={label}
          to={pathFor(segment)}
          className={cn(
            'relative whitespace-nowrap px-3 py-2 text-nav transition-colors',
            isActive(segment)
              ? 'font-medium text-devflow-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-devflow-primary'
              : 'text-devflow-text-secondary hover:text-devflow-text',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
