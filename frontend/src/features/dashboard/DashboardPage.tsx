import { Link } from 'react-router-dom'
import {
  Bug,
  CheckSquare,
  FolderKanban,
  LayoutGrid,
  Rocket,
} from 'lucide-react'
import { TopHeader } from '@/components/layout/TopHeader'
import { MetricCard } from '@/components/ui/MetricCard'
import { QuickActionCard } from '@/components/ui/QuickActionCard'
import { ROUTES } from '@/constants/routes'
import { mockProjects } from '@/services/mockProjects'
import { getActiveSprint } from '@/services/projectData'
import { ActivityFeed } from './ActivityFeed'
import { projectOverviewPath } from '@/constants/routes'

const quickLinks = [
  {
    icon: FolderKanban,
    title: 'Browse projects',
    description: 'Open a project workspace, backlog, and sprint boards.',
    to: ROUTES.projects,
  },
  {
    icon: CheckSquare,
    title: 'My tasks',
    description: 'Issues assigned to you across all projects.',
    to: ROUTES.myTasks,
  },
  {
    icon: Bug,
    title: 'QA management',
    description: 'Test plans, runs, and quality gates.',
    to: ROUTES.qa,
  },
  {
    icon: Rocket,
    title: 'Releases',
    description: 'Track versions and deployment status.',
    to: ROUTES.releases,
  },
] as const

export function DashboardPage() {
  const activeProjects = mockProjects.filter((p) => p.status === 'active').length
  const activeSprints = mockProjects.filter((p) => getActiveSprint(p.id)).length

  return (
    <>
      <TopHeader variant="projects" activeTab="Board" />
      <main className="page-main">
        <div className="page-stack min-w-0 flex-1">
          <div>
            <h1 className="text-page-title text-devflow-text">Dashboard</h1>
            <p className="text-body text-devflow-text-secondary">
              Workspace overview — pick a project, then a sprint, to work on the
              board.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Projects"
              value={String(mockProjects.length)}
              footer={`${activeProjects} active`}
            />
            <MetricCard
              label="Active sprints"
              value={String(activeSprints)}
              footer="Across your assigned projects"
              badge={{ text: 'Live', variant: 'success' }}
            />
            <MetricCard
              label="Open issues"
              value="54"
              footer="Workspace-wide"
            />
            <MetricCard
              label="Releases this month"
              value="3"
              footer="2 shipped, 1 scheduled"
            />
          </div>

          <div>
            <h2 className="mb-3 text-section-title text-devflow-text">
              Quick actions
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {quickLinks.map((item) => (
                <Link key={item.title} to={item.to} className="block">
                  <QuickActionCard
                    icon={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-section-title text-devflow-text">
                Your projects
              </h2>
              <Link
                to={ROUTES.projects}
                className="text-btn text-devflow-primary hover:underline"
              >
                View all
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {mockProjects.map((project) => {
                const sprint = getActiveSprint(project.id)
                return (
                  <li key={project.id}>
                    <Link
                      to={projectOverviewPath(project.id)}
                      className="flex items-center justify-between rounded-lg border border-devflow-border bg-devflow-card px-4 py-3 hover:shadow-devflow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <LayoutGrid className="size-5 text-devflow-primary" />
                        <div>
                          <span className="font-medium text-devflow-text">
                            {project.name}
                          </span>
                          <p className="text-caption text-devflow-text-secondary">
                            {sprint
                              ? `${sprint.name} • Active Sprint`
                              : 'No active sprint'}
                          </p>
                        </div>
                      </div>
                      <span className="text-caption text-devflow-text-secondary">
                        {project.progress ?? 0}% complete
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <ActivityFeed />
      </main>
    </>
  )
}
