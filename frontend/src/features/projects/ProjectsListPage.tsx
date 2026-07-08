import { useMemo, useState, useCallback, useEffect } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { TopHeader } from '@/components/layout/TopHeader'
import { ProjectCard } from '@/components/ui/ProjectCard'
import {
  ProjectFilters,
  type ProjectFilterId,
  type ProjectViewMode,
} from '@/components/ui/ProjectFilters'
import { useProjects } from '@/contexts/ProjectsContext'
import { useAppContext } from '@/features/context/useAppContext'
import { CreateProjectDrawer } from '@/features/projects/CreateProjectDrawer'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { getDashboardActivity } from '@/api/dashboard'
import type { DashboardActivityApi } from '@/types/dashboard'
import { projectMembersToAvatarGroup } from '@/features/members/memberUtils'
import { useProjectsMembersData } from '@/hooks/useProjectMembersData'
import { getActiveSprint } from '@/services/projectData'
import {
  filterProjects,
  sortProjectsByName,
} from '@/services/projectFilters'
import { projectOverviewPath, ROUTES } from '@/constants/routes'

export function ProjectsListPage() {
  const { projects } = useProjects()
  const { currentOrganization, user } = useAppContext()
  const [activeFilter, setActiveFilter] = useState<ProjectFilterId>('all')
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid')
  const [createOpen, setCreateOpen] = useState(false)
  const [activities, setActivities] = useState<DashboardActivityApi[] | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  const loadActivity = useCallback(async () => {
    setActivityLoading(true)
    setActivityError(null)
    try {
      const items = await getDashboardActivity(5)
      setActivities(items)
    } catch (err: unknown) {
      setActivityError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  const filteredProjects = useMemo(
    () => sortProjectsByName(filterProjects(projects, activeFilter)),
    [projects, activeFilter],
  )

  const membersByProject = useProjectsMembersData(
    filteredProjects.map((project) => project.id),
  )

  const hasAnyProjects = projects.length > 0
  const canCreateProjects =
    user?.is_superuser === true ||
    currentOrganization?.role === 'owner' ||
    currentOrganization?.role === 'admin' ||
    currentOrganization?.can_create_projects === true

  return (
    <>
      <TopHeader variant="projects" activeTab="List" />
      <main className="page-main">
        <div className="page-stack min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-page-title text-devflow-text">Projects</h1>
              <p className="mt-0.5 text-body text-devflow-text-secondary">
                Select a project to view overview and boards.
              </p>
            </div>
            {canCreateProjects ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm transition-opacity hover:opacity-95"
              >
                <Plus className="size-5" strokeWidth={2} />
                New Project
              </button>
            ) : null}
          </div>

          {hasAnyProjects && (
            <ProjectFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              resultCount={filteredProjects.length}
            />
          )}

          {filteredProjects.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'
                  : 'flex flex-col gap-2'
              }
            >
              {filteredProjects.map((project) => {
                const activeSprint =
                  project.methodology === 'scrum' ? getActiveSprint(project.id) : undefined
                const membersState = membersByProject[project.id]
                const { members: avatarMembers, extra: avatarExtra } =
                  projectMembersToAvatarGroup(membersState?.members ?? [])
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    to={projectOverviewPath(project.id)}
                    activeSprintName={activeSprint?.name}
                    activeSprintStatus={
                      activeSprint ? 'Active Sprint' : undefined
                    }
                    memberCount={membersState?.members.length ?? 0}
                    membersLoading={membersState?.loading ?? true}
                    avatarMembers={avatarMembers}
                    avatarExtra={avatarExtra}
                    viewMode={viewMode}
                  />
                )
              })}
            </div>
          ) : hasAnyProjects ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-10 text-center">
              <FolderKanban className="mb-3 size-8 text-devflow-text-muted" />
              <p className="text-section-title text-devflow-text">
                No projects match this filter
              </p>
              <p className="mt-1 max-w-sm text-body text-devflow-text-secondary">
                Try another filter or clear your selection to see all projects.
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="mt-4 text-btn text-devflow-primary hover:underline"
              >
                Show all projects
              </button>
            </div>
          ) : (
            <ProjectsEmptyState
              onCreate={canCreateProjects ? () => setCreateOpen(true) : undefined}
            />
          )}
        </div>

        <ActivityFeed
          variant="secondary"
          activities={activities}
          isLoading={activityLoading}
          error={activityError}
          onRetry={loadActivity}
          viewAllTo={ROUTES.workspaceActivity}
        />
      </main>

      <CreateProjectDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

function ProjectsEmptyState({ onCreate }: { onCreate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-12 text-center">
      <FolderKanban className="mb-3 size-9 text-devflow-text-muted" />
      <p className="text-section-title text-devflow-text">No projects yet</p>
      <p className="mt-2 max-w-md text-body text-devflow-text-secondary">
        Create your first project to start tracking work on the board.
      </p>
      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm transition-opacity hover:opacity-95"
        >
          <Plus className="size-4" strokeWidth={2} />
          Create project
        </button>
      ) : null}
    </div>
  )
}
