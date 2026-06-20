import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { LayoutGrid, Plus, Users } from 'lucide-react'
import {
  isProjectBoardPath,
  isSprintBoardPath,
  resolveSprintViewTab,
  ROUTES,
  sprintActivityPath,
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
import { useCreateIssue } from '@/contexts/CreateIssueContext'
import { ProjectMembersProvider, useProjectMembersContext } from '@/contexts/ProjectMembersContext'
import { projectMembersToAvatarGroup } from '@/features/members/memberUtils'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import {
  formatSprintMetaLine,
  getActiveSprint,
  getProjectById,
  getSprintById,
} from '@/services/projectData'

function resolveHeaderSubtitle(
  pathname: string,
  projectId: string,
  activeSprint: ReturnType<typeof getActiveSprint>,
): string {
  if (isProjectBoardPath(pathname)) {
    return 'Board'
  }

  const sprintMatch = pathname.match(/\/sprints\/([^/]+)/)
  const viewingSprint = sprintMatch
    ? getSprintById(projectId, sprintMatch[1])
    : undefined

  if (viewingSprint) {
    return formatSprintMetaLine(viewingSprint)
  }

  if (activeSprint) {
    return formatSprintMetaLine(activeSprint)
  }

  return 'No active sprint'
}

export function ProjectShell() {
  const { projectId = '' } = useParams()
  const project = getProjectById(projectId)

  if (!project) {
    return <Navigate to={ROUTES.projects} replace />
  }

  return (
    <ProjectMembersProvider projectId={projectId}>
      <ProjectShellContent project={project} projectId={projectId} />
    </ProjectMembersProvider>
  )
}

function ProjectShellContent({
  project,
  projectId,
}: {
  project: NonNullable<ReturnType<typeof getProjectById>>
  projectId: string
}) {
  const { pathname } = useLocation()
  useLoadProjectSprints(projectId)
  const activeSprint = getActiveSprint(projectId)
  const { members, loading: membersLoading } = useProjectMembersContext()
  const { members: avatarMembers, extra } = projectMembersToAvatarGroup(members)

  const sprintMatch = pathname.match(/\/sprints\/([^/]+)/)
  const sprintId = sprintMatch?.[1]
  const sprintViewTab = resolveSprintViewTab(pathname)
  const showSprintViewTabs =
    sprintId &&
    sprintViewTab &&
    sprintViewTab !== 'Board' &&
    !isSprintBoardPath(pathname)

  const { openCreateIssue } = useCreateIssue()

  const headerSubtitle = resolveHeaderSubtitle(pathname, projectId, activeSprint)

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
                {headerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <div className="hidden items-center gap-2 lg:flex">
              <Users className="size-3.5 text-devflow-text-secondary" />
              <span className="text-caption text-devflow-text-secondary">
                {membersLoading ? '—' : members.length}
              </span>
              <AvatarGroup members={avatarMembers} extra={extra} />
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
      {showSprintViewTabs ? (
        <SprintViewTabs
          activeTab={sprintViewTab}
          boardPath={sprintBoardPath(projectId, sprintId)}
          listPath={sprintListPath(projectId, sprintId)}
          activityPath={sprintActivityPath(projectId, sprintId)}
        />
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </>
  )
}
