import { FilePlus, Plus } from 'lucide-react'
import { TopHeader } from '@/components/layout/TopHeader'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { mockProjects } from '@/services/mockProjects'
import { ActivityFeed } from './ActivityFeed'

export function DashboardPage() {
  return (
    <>
      <TopHeader variant="projects" activeTab="List" />
      <main className="page-main">
        <div className="page-stack min-w-0 flex-1">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-page-title text-devflow-text">
                Projects
              </h1>
              <p className="text-body text-devflow-text-secondary">
                Manage and track your active workspace initiatives.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white"
            >
              <Plus className="size-5" strokeWidth={2} />
              New Project
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-devflow-border bg-[var(--df-empty-state)] p-6 opacity-70">
            <FilePlus className="mb-2 size-7 text-devflow-text-muted" />
            <p className="text-section-title text-devflow-text-secondary">
              Ready to scale?
            </p>
            <button
              type="button"
              className="mt-2 text-btn leading-normal text-devflow-primary hover:underline"
            >
              Add a new workspace branch
            </button>
          </div>
        </div>

        <ActivityFeed />
      </main>
    </>
  )
}
