import { Link, useLocation, useParams } from 'react-router-dom'
import {
  projectBacklogPath,
  projectOverviewPath,
  projectReleasesPath,
  projectReportsPath,
  projectSettingsPath,
  projectSprintsPath,
  projectTeamPath,
  sprintBoardPath,
} from '@/constants/routes'
import { getActiveSprint } from '@/services/projectData'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Overview', segment: '' },
  { label: 'Backlog', segment: 'backlog' },
  { label: 'Sprints', segment: 'sprints' },
  { label: 'Board', segment: 'board' },
  { label: 'Releases', segment: 'releases' },
  { label: 'Team', segment: 'team' },
  { label: 'Reports', segment: 'reports' },
  { label: 'Settings', segment: 'settings' },
] as const

type ProjectNavProps = {
  compact?: boolean
}

export function ProjectNav({ compact = false }: ProjectNavProps) {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()
  const activeSprint = getActiveSprint(projectId)

  const pathFor = (segment: (typeof navItems)[number]['segment']) => {
    switch (segment) {
      case '':
        return projectOverviewPath(projectId)
      case 'board':
        return activeSprint
          ? sprintBoardPath(projectId, activeSprint.id)
          : projectSprintsPath(projectId)
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
        return projectSettingsPath(projectId)
    }
  }

  const isActive = (segment: (typeof navItems)[number]['segment']) => {
    const base = projectOverviewPath(projectId)
    if (segment === '') {
      return pathname === base
    }
    if (segment === 'board') {
      return /\/sprints\/[^/]+\/board/.test(pathname)
    }
    if (segment === 'sprints') {
      return (
        pathname.includes('/sprints') &&
        !/\/sprints\/[^/]+\/(board|list|activity)/.test(pathname)
      )
    }
    return pathname.startsWith(pathFor(segment))
  }

  return (
    <nav
      className={cn(
        'flex flex-wrap items-center gap-0.5 border-t border-devflow-border/60 px-4',
        compact ? 'py-0' : 'py-0.5',
      )}
      aria-label="Project navigation"
    >
      {navItems.map(({ label, segment }) => (
        <Link
          key={label}
          to={pathFor(segment)}
          className={cn(
            'text-nav transition-colors',
            compact ? 'px-2.5 py-1.5' : 'px-3 py-2',
            isActive(segment)
              ? 'font-medium text-devflow-primary'
              : 'text-devflow-text-secondary hover:text-devflow-text',
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
