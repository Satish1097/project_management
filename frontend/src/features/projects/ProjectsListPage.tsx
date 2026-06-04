import { useMemo, useState } from 'react'
import { FolderKanban, Plus } from 'lucide-react'
import { TopHeader } from '@/components/layout/TopHeader'
import { ProjectCard } from '@/components/ui/ProjectCard'
import {
  ProjectFilters,
  type ProjectFilterId,
  type ProjectViewMode,
} from '@/components/ui/ProjectFilters'
import { mockProjects } from '@/services/mockProjects'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { getActiveSprint, getTeamCount } from '@/services/projectData'
import {
  filterProjects,
  sortProjectsByName,
} from '@/services/projectFilters'
import { projectOverviewPath } from '@/constants/routes'

export function ProjectsListPage() {
  const [activeFilter, setActiveFilter] = useState<ProjectFilterId>('all')
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid')

  const filteredProjects = useMemo(
    () => sortProjectsByName(filterProjects(mockProjects, activeFilter)),
    [activeFilter],
  )

  const hasAnyProjects = mockProjects.length > 0

  return (
    <>
      <TopHeader variant="projects" activeTab="List" />
      <main className="page-main">
        <div className="page-stack min-w-0 flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-page-title text-devflow-text">Projects</h1>
              <p className="mt-0.5 text-body text-devflow-text-secondary">
                Select a project to view overview, sprints, and boards.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm transition-opacity hover:opacity-95"
            >
              <Plus className="size-5" strokeWidth={2} />
              New Project
            </button>
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
                const activeSprint = getActiveSprint(project.id)
                const teamCount = getTeamCount(project)
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    to={projectOverviewPath(project.id)}
                    activeSprintName={activeSprint?.name}
                    activeSprintStatus={
                      activeSprint ? 'Active Sprint' : undefined
                    }
                    teamCount={teamCount}
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
            <ProjectsEmptyState />
          )}
        </div>

        <ActivityFeed variant="secondary" />
      </main>
    </>
  )
}

function ProjectsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-12 text-center">
      <FolderKanban className="mb-3 size-9 text-devflow-text-muted" />
      <p className="text-section-title text-devflow-text">No projects yet</p>
      <p className="mt-2 max-w-md text-body text-devflow-text-secondary">
        Create your first project to start planning sprints and tracking work.
      </p>
      <button
        type="button"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm transition-opacity hover:opacity-95"
      >
        <Plus className="size-4" strokeWidth={2} />
        Create project
      </button>
    </div>
  )
}
