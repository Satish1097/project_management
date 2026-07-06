import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MetricCard } from '@/components/ui/MetricCard'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import { AvatarGroup } from '@/components/ui/AvatarGroup'
import {
  projectBacklogPath,
  projectBacklogSprintPath,
  projectSprintsPath,
  sprintBoardPath,
  sprintDetailPath,
} from '@/constants/routes'
import {
  SprintFiltersBar,
  type SprintFilterStatus,
  type SprintSortKey,
} from '@/features/sprints/SprintFiltersBar'
import { useSprints } from '@/contexts/SprintsContext'
import { projectMembersToAvatarGroup } from '@/features/members/memberUtils'
import { useProjectMembersData } from '@/hooks/useProjectMembersData'
import { demoProjects, getWorkspaceSprintStats } from '@/services/demoData'
import {
  formatSprintStatusLabel,
  getProjectById,
  getSprintCompletionPercent,
  getSprintDaysRemaining,
} from '@/services/projectData'
import type { Sprint } from '@/types/sprints'
import { cn } from '@/utils/cn'

const workspaceProjectOptions = [
  { id: 'all', label: 'All Projects' },
  ...demoProjects.map((p) => ({ id: p.id, label: p.name })),
]

export function WorkspaceSprintsPage() {
  const { sprints: allSprints } = useSprints()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SprintFilterStatus>('all')
  const [projectFilter, setProjectFilter] = useState('all')
  const [sort, setSort] = useState<SprintSortKey>('date')

  const stats = useMemo(
    () => getWorkspaceSprintStats(allSprints),
    [allSprints],
  )

  const filtered = useMemo(() => {
    let list = [...allSprints]
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((s) => {
        const project = getProjectById(s.projectId)
        return (
          s.name.toLowerCase().includes(q) ||
          s.goal?.toLowerCase().includes(q) ||
          project?.name.toLowerCase().includes(q)
        )
      })
    }
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter)
    }
    if (projectFilter !== 'all') {
      list = list.filter((s) => s.projectId === projectFilter)
    }
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'status') return a.status.localeCompare(b.status)
      return b.startDate.localeCompare(a.startDate)
    })
    return list
  }, [allSprints, query, statusFilter, projectFilter, sort])

  return (
    <main className="page-main">
      <div className="page-stack min-w-0 flex-1">
        <div>
          <h2 className="text-page-title text-devflow-text">Sprints</h2>
          <p className="mt-0.5 text-body text-devflow-text-secondary">
            Cross-project sprint planning and delivery across your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Active Sprints"
            value={String(stats.active)}
            footer="Currently in progress"
            badge={
              stats.active > 0
                ? { text: 'Live', variant: 'success' }
                : undefined
            }
          />
          <MetricCard
            label="Planned Sprints"
            value={String(stats.planned)}
            footer="Ready to start"
          />
          <MetricCard
            label="Completed Sprints"
            value={String(stats.completed)}
            footer="Last 90 days"
          />
          <MetricCard
            label="Blocked Issues"
            value={String(stats.blockedIssues)}
            footer="Across active sprints"
            badge={
              stats.blockedIssues > 0
                ? { text: 'Attention', variant: 'warning' }
                : undefined
            }
          />
        </div>

        <SprintFiltersBar
          variant="workspace"
          query={query}
          onQueryChange={setQuery}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          sort={sort}
          onSortChange={setSort}
          projectFilter={projectFilter}
          onProjectFilterChange={setProjectFilter}
          projectOptions={workspaceProjectOptions}
        />

        {filtered.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {filtered.map((sprint) => (
              <li key={`${sprint.projectId}-${sprint.id}`}>
                <WorkspaceSprintCard sprint={sprint} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-10 text-center">
            <p className="text-section-title text-devflow-text">
              No sprints match your filters
            </p>
            <p className="mt-1 text-body text-devflow-text-secondary">
              Adjust search, status, or project filters to see sprints.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function WorkspaceSprintCard({ sprint }: { sprint: Sprint }) {
  const project = getProjectById(sprint.projectId)
  const { members, loading: membersLoading } = useProjectMembersData(
    sprint.projectId,
  )
  const { members: avatarMembers, extra: avatarExtra } =
    projectMembersToAvatarGroup(members)
  const pct = getSprintCompletionPercent(sprint)
  const daysLeft = getSprintDaysRemaining(sprint)
  const isActive = sprint.status === 'active'

  if (!project) return null

  return (
    <article
      className={cn(
        'rounded-lg border bg-devflow-card p-4 shadow-devflow-sm',
        isActive
          ? 'border-devflow-primary/30 bg-[var(--df-nav-tint)]/30'
          : 'border-devflow-border',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-section-title text-devflow-text">{sprint.name}</h3>
            <SprintStatusBadge status={sprint.status} />
            <span className="text-caption text-devflow-text-muted">
              {formatSprintStatusLabel(sprint.status)}
            </span>
          </div>
          <p className="mt-1 text-caption text-devflow-text-secondary">
            <span className="font-medium text-devflow-text">{project.name}</span>
            {' · '}
            {sprint.dateRange}
          </p>
        </div>
        {isActive && (
          <span className="text-metric font-semibold text-devflow-primary">
            {pct}%
          </span>
        )}
      </div>

      {isActive && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-devflow-progress-track">
          <div
            className="h-full rounded-full bg-devflow-success transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-caption text-devflow-text-secondary">
        <span>
          {sprint.issueCount} issue{sprint.issueCount === 1 ? '' : 's'}
        </span>
        {daysLeft != null && (
          <span>
            {daysLeft} day{daysLeft === 1 ? '' : 's'} left
          </span>
        )}
        {!isActive && sprint.status === 'completed' && (
          <span>{pct}% delivered</span>
        )}
        <AvatarGroup
          members={membersLoading ? [] : avatarMembers}
          extra={membersLoading ? undefined : avatarExtra}
          size={24}
          projectId={sprint.projectId}
        />
      </div>

      {sprint.goal && (
        <p className="mt-2 text-body text-devflow-text-secondary">
          <span className="text-caption font-medium text-devflow-text-muted">
            Goal:{' '}
          </span>
          {sprint.goal}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={sprintBoardPath(sprint.projectId, sprint.id)}
          className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white shadow-devflow-sm hover:opacity-95"
        >
          Open Board
        </Link>
        <Link
          to={projectBacklogSprintPath(sprint.projectId, sprint.id)}
          className="rounded-lg border border-devflow-border bg-devflow-card px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface"
        >
          Plan
        </Link>
        <Link
          to={projectBacklogPath(sprint.projectId)}
          className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-card"
        >
          Backlog
        </Link>
        <Link
          to={sprintDetailPath(sprint.projectId, sprint.id)}
          className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-card"
        >
          View Sprint
        </Link>
        <Link
          to={projectSprintsPath(sprint.projectId)}
          className="rounded-lg px-3 py-1.5 text-btn text-devflow-primary hover:underline"
        >
          {project.key ?? 'Project'} sprints
        </Link>
      </div>
    </article>
  )
}
