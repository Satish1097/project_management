import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { LayoutGrid, Users } from 'lucide-react'
import {
  ROUTES,
  isSprintViewPath,
  resolveSprintViewTab,
  sprintActivityPath,
  sprintAdvancedBoardPath,
  sprintBoardPath,
  sprintListPath,
} from '@/constants/routes'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge'
import { ProjectNav } from '@/components/layout/ProjectNav'
import { SprintViewTabs } from '@/components/layout/SprintViewTabs'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { Avatar } from '@/components/ui/Avatar'
import {
  formatSprintMetaLine,
  getActiveSprint,
  getProjectById,
  getSprintById,
  getTeamCount,
} from '@/services/projectData'

export function ProjectShell() {
  const { projectId = '' } = useParams()
  const { pathname } = useLocation()
  const project = getProjectById(projectId)
  const activeSprint = getActiveSprint(projectId)

  const sprintMatch = pathname.match(/\/sprints\/([^/]+)/)
  const viewingSprint = sprintMatch
    ? getSprintById(projectId, sprintMatch[1])
    : undefined
  const headerSprint = viewingSprint ?? activeSprint
  const isSprintView = isSprintViewPath(pathname)
  const sprintTab = resolveSprintViewTab(pathname)

  if (!project) {
    return <Navigate to={ROUTES.projects} replace />
  }

  const teamCount = getTeamCount(project)
  const sprintId = sprintMatch?.[1]

  return (
    <>
      <header className="sticky top-0 z-10 shrink-0 border-b border-devflow-border bg-devflow-card">
        <div className="flex items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--df-nav-tint)] text-devflow-primary">
              <LayoutGrid className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-page-title text-devflow-text">
                  {project.name}
                </h1>
                {!isSprintView && (
                  <ProjectStatusBadge status={project.status} size="sm" />
                )}
              </div>
              <p className="mt-0.5 truncate text-body text-devflow-text-secondary/75">
                {headerSprint
                  ? formatSprintMetaLine(headerSprint)
                  : 'No active sprint'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {!isSprintView && (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Users className="size-4 text-devflow-text-secondary" />
                  <span className="text-caption text-devflow-text-secondary">
                    {teamCount} members
                  </span>
                  <AvatarGroup
                    members={project.members}
                    extra={project.extraMembers}
                  />
                </div>
                {project.progress !== undefined && (
                  <div className="hidden w-24 md:block">
                    <div className="mb-0.5 flex justify-between text-caption text-devflow-text-secondary">
                      <span>Progress</span>
                      <span className="font-medium text-devflow-text">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-devflow-table-header">
                      <div
                        className="h-full rounded-full bg-devflow-success"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            <ThemeToggle />
            <NotificationBell />
            <Avatar
              name="You"
              color="#94a3b8"
              size={28}
              className="border border-devflow-border bg-devflow-avatar-bg"
            />
          </div>
        </div>

        {isSprintView && sprintTab && sprintId && (
          <SprintViewTabs
            activeTab={sprintTab}
            boardPath={sprintBoardPath(projectId, sprintId)}
            listPath={sprintListPath(projectId, sprintId)}
            activityPath={sprintActivityPath(projectId, sprintId)}
            trailing={
              sprintTab === 'Board' ? (
                <Link
                  to={sprintAdvancedBoardPath(projectId, sprintId)}
                  className="text-caption text-devflow-text-secondary hover:text-devflow-primary"
                >
                  Advanced board
                </Link>
              ) : undefined
            }
          />
        )}

        <ProjectNav compact={isSprintView} />
      </header>
      <Outlet />
    </>
  )
}
