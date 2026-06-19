import { Link, useLocation, useParams } from 'react-router-dom'
import {
  projectActivityPath,
  projectBacklogPath,
  projectKanbanPath,
  projectOverviewPath,
  projectReleasesPath,
  projectSettingsGeneralPath,
  projectSettingsPath,
  projectSprintsPath,
  projectTeamPath,
} from '@/constants/routes'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Overview', segment: '' },
  { label: 'Backlog', segment: 'backlog' },
  { label: 'Board', segment: 'board' },
  { label: 'Sprints', segment: 'sprints' },
  { label: 'Activity', segment: 'activity' },
  { label: 'Releases', segment: 'releases' },
  { label: 'Team', segment: 'team' },
  { label: 'Settings', segment: 'settings' },
] as const

export function ProjectNav() {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()

  const pathFor = (segment: (typeof navItems)[number]['segment']) => {
    switch (segment) {
      case '':
        return projectOverviewPath(projectId)
      case 'board':
        return projectKanbanPath(projectId)
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
      case 'settings':
        return projectSettingsGeneralPath(projectId)
    }
  }

  const isActive = (segment: (typeof navItems)[number]['segment']) => {
    const base = projectOverviewPath(projectId)
    if (segment === '') {
      return pathname === base
    }
    if (segment === 'board') {
      return pathname === projectKanbanPath(projectId)
    }
    if (segment === 'activity') {
      return pathname === projectActivityPath(projectId)
    }
    if (segment === 'sprints') {
      return (
        /\/projects\/[^/]+\/sprints\/?$/.test(pathname) ||
        (/\/projects\/[^/]+\/sprints\/[^/]+/.test(pathname) &&
          !/\/sprints\/[^/]+\/(board|list|activity|planning)(?:\/|$)/.test(
            pathname,
          ))
      )
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
      {navItems.map(({ label, segment }) => (
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
