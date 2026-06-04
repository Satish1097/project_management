import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { LayoutGrid, Plus, Users } from 'lucide-react'
import { ROUTES } from '@/constants/routes'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge'
import { ProjectNav } from '@/components/layout/ProjectNav'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { NotificationBell } from '@/features/notifications/NotificationBell'
import { Avatar } from '@/components/ui/Avatar'
import { useCreateIssue } from '@/contexts/CreateIssueContext'
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
  const { openCreateIssue } = useCreateIssue()

  if (!project) {
    return <Navigate to={ROUTES.projects} replace />
  }

  const teamCount = getTeamCount(project)

  return (
    <>
      <header className="sticky top-0 z-10 shrink-0 border-b border-devflow-border bg-devflow-card">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--df-nav-tint)] text-devflow-primary">
              <LayoutGrid className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold leading-tight text-devflow-text">
                  {project.name}
                </h1>
                <ProjectStatusBadge status={project.status} size="sm" />
              </div>
              <p className="truncate text-caption text-devflow-text-secondary">
                {headerSprint
                  ? formatSprintMetaLine(headerSprint)
                  : 'No active sprint'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden items-center gap-2 lg:flex">
              <Users className="size-3.5 text-devflow-text-secondary" />
              <span className="text-caption text-devflow-text-secondary">
                {teamCount}
              </span>
              <AvatarGroup
                members={project.members}
                extra={project.extraMembers}
              />
            </div>
            {project.progress !== undefined && (
              <div className="hidden w-20 xl:block">
                <div className="mb-0.5 flex justify-between text-caption text-devflow-text-secondary">
                  <span>{project.progress}%</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-devflow-table-header">
                  <div
                    className="h-full rounded-full bg-devflow-success"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => openCreateIssue()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white shadow-devflow-sm hover:opacity-95"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">Create Issue</span>
            </button>
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

        <ProjectNav />
      </header>
      <Outlet />
    </>
  )
}
