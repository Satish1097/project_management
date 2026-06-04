import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Calendar, History } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge'
import {
  formatSprintStatus,
  getActiveSprint,
  getProjectById,
  getSprintsForProject,
  getTeamCount,
} from '@/services/projectData'
import {
  projectSprintsPath,
  sprintBoardPath,
} from '@/constants/routes'
import { layout } from '@/constants/layout'

export function ProjectOverviewPage() {
  const { projectId = '' } = useParams()
  const project = getProjectById(projectId)
  const activeSprint = getActiveSprint(projectId)
  const sprints = getSprintsForProject(projectId)

  if (!project) return null

  const teamCount = getTeamCount(project)
  const openLabel = project.openIssuesLabel ?? project.issuesLabel

  return (
    <main className="page-main !gap-0 p-4">
      <div className="page-stack max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-page-title text-devflow-text">Overview</h2>
              <ProjectStatusBadge status={project.status} size="sm" />
            </div>
            <p className="mt-1 max-w-2xl text-body text-devflow-text-secondary">
              {project.description}
            </p>
          </div>
          {activeSprint && (
            <Link
              to={sprintBoardPath(projectId, activeSprint.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-devflow-border bg-devflow-card px-3 py-2 text-btn text-devflow-primary transition-shadow hover:shadow-devflow-sm"
            >
              Open sprint board
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Open issues"
            value={openLabel.replace(/\D/g, '') || '—'}
            footer={openLabel}
            badge={
              project.issuesCritical
                ? { text: 'Needs attention', variant: 'danger' }
                : { text: 'On track', variant: 'success' }
            }
          />
          <MetricCard
            label="Active sprint"
            value={activeSprint?.name ?? 'None'}
            footer={
              activeSprint
                ? formatSprintStatus(activeSprint.status)
                : 'Start a sprint from Sprints'
            }
            icon={<Calendar className="size-4 text-devflow-text-secondary" />}
          />
          <MetricCard
            label="Team"
            value={String(teamCount)}
            footer="Members with project access"
          />
          <MetricCard
            label="Sprint progress"
            value={`${project.progress ?? 0}%`}
            progress={project.progress}
            footer="Issues completed in active sprint"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {activeSprint && (
            <div className={cnCard('lg:col-span-2')}>
              <p className="text-label text-devflow-text-secondary">
                Active sprint
              </p>
              <h3 className="mt-1 text-section-title text-devflow-text">
                {activeSprint.name}
              </h3>
              <p className="mt-1 text-body text-devflow-text-secondary">
                {activeSprint.dateRange}
                {activeSprint.goal ? ` — ${activeSprint.goal}` : ''}
              </p>
              {project.progress !== undefined && (
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-caption text-devflow-text-secondary">
                    <span>Sprint progress</span>
                    <span className="font-medium text-devflow-text">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-devflow-table-header">
                    <div
                      className="h-full rounded-full bg-devflow-success"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="mt-3 text-caption text-devflow-success">
                {formatSprintStatus(activeSprint.status)}
              </p>
            </div>
          )}

          <div className={cnCard(activeSprint ? '' : 'lg:col-span-3')}>
            <div className="mb-3 flex items-center gap-2">
              <History className="size-4 text-devflow-text-secondary" />
              <h3 className="text-section-title text-devflow-text">
                Recent activity
              </h3>
            </div>
            {project.recentActivity ? (
              <p className="text-body text-devflow-text">{project.recentActivity}</p>
            ) : (
              <p className="text-body text-devflow-text-secondary">
                No recent updates for this project.
              </p>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-[var(--df-border-faint)] pt-4">
              <span className="text-caption text-devflow-text-secondary">
                Team
              </span>
              <AvatarGroup
                members={project.members}
                extra={project.extraMembers}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-section-title text-devflow-text">Sprints</h3>
            <Link
              to={projectSprintsPath(projectId)}
              className="text-btn text-devflow-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {sprints.slice(0, 3).map((sprint) => (
              <li key={sprint.id}>
                <Link
                  to={sprintBoardPath(projectId, sprint.id)}
                  className="flex items-center justify-between rounded-lg border border-devflow-border bg-devflow-card px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:shadow-devflow-sm"
                >
                  <div>
                    <span className="font-medium text-devflow-text">
                      {sprint.name}
                    </span>
                    <p className="text-caption text-devflow-text-secondary">
                      {sprint.dateRange}
                    </p>
                  </div>
                  <span className="text-caption text-devflow-text-secondary">
                    {sprint.completedCount}/{sprint.issueCount} done
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

function cnCard(extra?: string) {
  return [layout.uiCard, extra].filter(Boolean).join(' ')
}
