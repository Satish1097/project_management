import { Link, useParams } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, History } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed'
import { getProjectActivityPreview } from '@/api/projects'
import type { DashboardActivityApi } from '@/types/dashboard'
import type { Sprint } from '@/types/sprints'
import {
  formatSprintStatus,
  getActiveSprint,
  getProjectById,
  getSprintsForProject,
  getSprintCompletionPercent,
  getSprintIssueStats,
  getTeamCount,
} from '@/services/projectData'
import {
  projectActivityPath,
  projectSprintsPath,
  sprintBoardPath,
  sprintDetailPath,
} from '@/constants/routes'
import { layout } from '@/constants/layout'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { useProjectIssueStats } from '@/hooks/useProjectIssueStats'
import { cn } from '@/utils/cn'

export function ProjectOverviewPage() {
  const { projectId = '' } = useParams()
  const project = getProjectById(projectId)
  const { loading: sprintsLoading } = useLoadProjectSprints(projectId)
  const { stats: issueStats, loading: issueStatsLoading } = useProjectIssueStats(projectId)
  const activeSprint = getActiveSprint(projectId)
  const sprints = getSprintsForProject(projectId)
  const [activities, setActivities] = useState<DashboardActivityApi[] | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activityError, setActivityError] = useState<string | null>(null)

  const loadActivity = useCallback(async () => {
    if (!projectId) return

    setActivityLoading(true)
    setActivityError(null)
    try {
      const items = await getProjectActivityPreview(projectId, 5)
      setActivities(items)
    } catch (err: unknown) {
      setActivityError(err instanceof Error ? err.message : 'Failed to load activity')
    } finally {
      setActivityLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadActivity()
  }, [loadActivity])

  if (!project) return null

  const teamCount = getTeamCount(project)
  const openIssueCount = issueStats?.openIssues ?? project.openIssueCount
  const openLabel =
    openIssueCount != null
      ? `${openIssueCount} Open ${openIssueCount === 1 ? 'Issue' : 'Issues'}`
      : (project.openIssuesLabel ?? project.issuesLabel)
  const sprintProgress = activeSprint ? getSprintCompletionPercent(activeSprint) : 0

  return (
    <main className="page-main !gap-0 p-4">
      <div className="page-stack min-w-0 w-full flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-page-title text-devflow-text">Overview</h2>
              <ProjectStatusBadge status={project.status} size="sm" />
            </div>
            {project.description && (
              <p className="mt-1 max-w-3xl text-body text-devflow-text-secondary">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Open issues"
            value={
              issueStatsLoading
                ? '—'
                : openIssueCount != null
                  ? String(openIssueCount)
                  : openLabel.replace(/\D/g, '') || '—'
            }
            footer={issueStatsLoading ? 'Loading issue stats…' : openLabel}
            badge={
              project.issuesCritical
                ? { text: 'Needs attention', variant: 'danger' }
                : { text: 'On track', variant: 'success' }
            }
          />
          <MetricCard
            label="Active sprint"
            value={sprintsLoading ? '—' : (activeSprint?.name ?? 'None')}
            footer={
              sprintsLoading
                ? 'Loading sprints…'
                : activeSprint
                  ? formatSprintStatus(activeSprint.status)
                  : 'Start a sprint from Sprints'
            }
          />
          <MetricCard
            label="Team members"
            value={String(teamCount)}
            footer="Members with project access"
          />
          <MetricCard
            label="Sprint progress"
            value={sprintsLoading ? '—' : `${sprintProgress}%`}
            progress={sprintsLoading ? undefined : sprintProgress}
            footer={
              sprintsLoading ? 'Loading sprints…' : 'Issues completed in active sprint'
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)] lg:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            {!sprintsLoading && activeSprint && (
              <ActiveSprintCard
                sprint={activeSprint}
                projectId={projectId}
                progress={sprintProgress}
              />
            )}

            {!sprintsLoading && sprints.length > 0 && (
              <SprintListSection projectId={projectId} sprints={sprints} />
            )}

            {!sprintsLoading && !activeSprint && sprints.length === 0 && (
              <div className={cn(layout.uiCard, 'text-center')}>
                <p className="text-body text-devflow-text-secondary">
                  No sprints yet. Create one from the Sprints page to start tracking work.
                </p>
                <Link
                  to={projectSprintsPath(projectId)}
                  className="mt-2 inline-flex items-center gap-1 text-btn text-devflow-primary hover:underline"
                >
                  Go to Sprints
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>

          <aside className={cn(layout.uiCard, 'min-w-0')}>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <History className="size-4 shrink-0 text-devflow-text-secondary" />
                <h3 className="truncate text-section-title text-devflow-text">
                  Recent activity
                </h3>
              </div>
              <Link
                to={projectActivityPath(projectId)}
                className="inline-flex shrink-0 items-center gap-0.5 text-caption text-devflow-primary hover:underline"
              >
                View all activity
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <ActivityFeed
              embedded
              variant="preview"
              showProjectName={false}
              activities={activities}
              isLoading={activityLoading}
              error={activityError}
              onRetry={loadActivity}
            />
          </aside>
        </div>
      </div>
    </main>
  )
}

function ActiveSprintCard({
  sprint,
  projectId,
  progress,
}: {
  sprint: Sprint
  projectId: string
  progress: number
}) {
  const stats = getSprintIssueStats(sprint)

  return (
    <article className={cn(layout.uiCard, 'border-devflow-primary/25 bg-[var(--df-nav-tint)]/30 py-2.5')}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-section-title text-devflow-text">{sprint.name}</h3>
            <SprintStatusBadge status={sprint.status} />
          </div>
          <p className="mt-0.5 text-caption text-devflow-text-secondary">
            {formatSprintDateRange(sprint.dateRange)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-metric font-semibold tabular-nums text-devflow-primary">
            {progress}%
          </span>
          <Link
            to={sprintBoardPath(projectId, sprint.id)}
            className="inline-flex items-center gap-0.5 text-[11px] text-devflow-primary hover:underline"
          >
            Sprint board
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-devflow-progress-track">
        <div
          className="h-full rounded-full bg-devflow-success transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-caption text-devflow-text-secondary">
        <Stat label="Completed" value={stats.completed} />
        <Stat label="Remaining" value={stats.remaining} />
        <Stat label="In progress" value={stats.inProgress} />
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span>
      <span className="font-medium tabular-nums text-devflow-text">{value}</span>{' '}
      {label.toLowerCase()}
    </span>
  )
}

function SprintListSection({
  projectId,
  sprints,
}: {
  projectId: string
  sprints: Sprint[]
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-section-title text-devflow-text">Sprints</h3>
        <Link
          to={projectSprintsPath(projectId)}
          className="inline-flex shrink-0 items-center gap-0.5 text-caption text-devflow-primary hover:underline"
        >
          View all
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <ul className="flex flex-col gap-1.5">
        {sprints.slice(0, 5).map((sprint) => (
          <li key={sprint.id}>
            <Link
              to={sprintDetailPath(projectId, sprint.id)}
              className="block rounded-lg border border-devflow-border bg-devflow-card px-3 py-2 transition-colors hover:border-devflow-primary/30 hover:bg-devflow-muted/40"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium text-devflow-text">
                  {sprint.name}
                </span>
                <span className="shrink-0 text-caption tabular-nums text-devflow-text-secondary">
                  {sprint.completedCount}/{sprint.issueCount} done
                </span>
              </div>
              <p className="text-[11px] text-devflow-text-muted">
                {formatSprintDateRange(sprint.dateRange)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatSprintDateRange(dateRange: string): string {
  return dateRange.replace(/\s*[-–]\s*/g, ' → ')
}
