import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import {
  sprintBoardPath,
  sprintDetailPath,
  sprintPlanningPath,
} from '@/constants/routes'
import { CreateSprintDrawer } from '@/features/sprints/CreateSprintDrawer'
import { CompleteSprintModal } from '@/features/sprints/CompleteSprintModal'
import {
  SprintFiltersBar,
  type SprintFilterStatus,
  type SprintSortKey,
} from '@/features/sprints/SprintFiltersBar'
import { useSprints } from '@/contexts/SprintsContext'
import { useSprintActions } from '@/hooks/useSprintActions'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import {
  formatSprintStatus,
  getSprintCompletionPercent,
  getSprintSuccessRate,
  getSprintsForProject,
} from '@/services/projectData'
import type { Sprint } from '@/types/sprints'
import { cn } from '@/utils/cn'

export function ProjectSprintsPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const { sprints: allSprints, loading, error } = useSprints()
  const { startSprint, completeSprint } = useSprintActions(projectId)
  useLoadProjectSprints(projectId)

  const [createOpen, setCreateOpen] = useState(false)
  const [completeTarget, setCompleteTarget] = useState<Sprint | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<SprintFilterStatus>('all')
  const [sort, setSort] = useState<SprintSortKey>('date')
  const [actionError, setActionError] = useState<string | null>(null)

  const projectSprints = useMemo(
    () => allSprints.filter((s) => s.projectId === projectId),
    [allSprints, projectId],
  )

  const filtered = useMemo(() => {
    let list = [...getSprintsForProject(projectId)]
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.goal?.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== 'all') {
      list = list.filter((s) => s.status === statusFilter)
    }
    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'status') return a.status.localeCompare(b.status)
      return b.startDate.localeCompare(a.startDate)
    })
    return list
  }, [projectId, query, statusFilter, sort, projectSprints])

  const active = filtered.find((s) => s.status === 'active')
  const planned = filtered.filter((s) => s.status === 'planned')
  const completed = filtered.filter((s) => s.status === 'completed')
  const other = filtered.filter(
    (s) =>
      !['active', 'planned', 'completed'].includes(s.status) &&
      s.id !== active?.id,
  )

  const nextSprintNumber =
    projectSprints.length > 0
      ? Math.max(
          ...projectSprints.map((s) => {
            const m = s.name.match(/(\d+)\s*$/)
            return m ? Number(m[1]) : 0
          }),
        ) + 1
      : 1

  const handleStart = async (sprint: Sprint) => {
    setActionError(null)
    const result = await startSprint(sprint.id)
    if (!result.ok) {
      setActionError(result.message)
      return
    }
    navigate(sprintBoardPath(projectId, sprint.id))
  }

  return (
    <>
      <main className="page-main">
        <div className="page-stack min-w-0 max-w-4xl flex-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-page-title text-devflow-text">Sprints</h2>
              <p className="mt-0.5 text-body text-devflow-text-secondary">
                Plan, start, and complete iterations for this project.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-devflow-primary px-4 py-2 text-btn text-white shadow-devflow-sm hover:opacity-95"
            >
              <Plus className="size-4" strokeWidth={2} />
              Create Sprint
            </button>
          </div>

          {actionError && (
            <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
              {actionError}
            </p>
          )}

          {error && (
            <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
              {error}
            </p>
          )}

          {loading && filtered.length === 0 && (
            <p className="text-body text-devflow-text-secondary">Loading sprints…</p>
          )}

          <SprintFiltersBar
            query={query}
            onQueryChange={setQuery}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            sort={sort}
            onSortChange={setSort}
          />

          {active && statusFilter !== 'planned' && statusFilter !== 'completed' && (
            <section className="flex flex-col gap-2">
              <h3 className="text-section-title text-devflow-text">Active sprint</h3>
              <ActiveSprintCard
                sprint={active}
                projectId={projectId}
                onComplete={() => setCompleteTarget(active)}
              />
            </section>
          )}

          {planned.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-section-title text-devflow-text">
                Planned / upcoming
              </h3>
              <ul className="flex flex-col gap-2">
                {planned.map((sprint) => (
                  <li key={sprint.id}>
                    <PlannedSprintCard
                      sprint={sprint}
                      projectId={projectId}
                      onStart={() => void handleStart(sprint)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {completed.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-section-title text-devflow-text">
                Completed sprints
              </h3>
              <ul className="flex flex-col gap-2">
                {completed.map((sprint) => (
                  <li key={sprint.id}>
                    <CompletedSprintCard sprint={sprint} projectId={projectId} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {other.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-section-title text-devflow-text">Other</h3>
              <ul className="flex flex-col gap-2">
                {other.map((sprint) => (
                  <li key={sprint.id}>
                    <PlannedSprintCard
                      sprint={sprint}
                      projectId={projectId}
                      onStart={() => void handleStart(sprint)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {filtered.length === 0 && !loading && (
            <div className="rounded-lg border border-dashed border-devflow-border bg-[var(--df-empty-state)] px-6 py-10 text-center">
              <p className="text-section-title text-devflow-text">
                No sprints match your filters
              </p>
              <p className="mt-1 text-body text-devflow-text-secondary">
                Create a sprint or adjust search and status filters.
              </p>
            </div>
          )}
        </div>
      </main>

      <CreateSprintDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={projectId}
        suggestedName={`Sprint ${nextSprintNumber}`}
        onCreated={(id) => navigate(sprintPlanningPath(projectId, id))}
      />

      {completeTarget && (
        <CompleteSprintModal
          open
          projectId={projectId}
          sprint={completeTarget}
          onClose={() => setCompleteTarget(null)}
          onComplete={(opts) => {
            void completeSprint(completeTarget.id, opts).finally(() => {
              setCompleteTarget(null)
            })
          }}
        />
      )}
    </>
  )
}

function ActiveSprintCard({
  sprint,
  projectId,
  onComplete,
}: {
  sprint: Sprint
  projectId: string
  onComplete: () => void
}) {
  const pct = getSprintCompletionPercent(sprint)

  return (
    <article className="rounded-lg border border-devflow-primary/30 bg-[var(--df-nav-tint)]/40 p-4 shadow-devflow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-section-title text-devflow-text">{sprint.name}</h4>
            <SprintStatusBadge status="active" />
            <span className="text-caption text-devflow-text-muted">
              {formatSprintStatus('active')}
            </span>
          </div>
          <p className="mt-1 text-caption text-devflow-text-secondary">
            {sprint.dateRange}
          </p>
        </div>
        <span className="text-metric font-semibold text-devflow-primary">{pct}%</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-devflow-progress-track">
        <div
          className="h-full rounded-full bg-devflow-success transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-body text-devflow-text-secondary">
        {sprint.issueCount} issues · {sprint.completedCount} completed
      </p>
      {sprint.goal && (
        <p className="mt-2 text-caption text-devflow-text-muted">{sprint.goal}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={sprintBoardPath(projectId, sprint.id)}
          className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white shadow-devflow-sm hover:opacity-95"
        >
          Open board
        </Link>
        <Link
          to={sprintDetailPath(projectId, sprint.id)}
          className="rounded-lg border border-devflow-border bg-devflow-card px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface"
        >
          View details
        </Link>
        <button
          type="button"
          onClick={onComplete}
          className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-card"
        >
          Complete sprint
        </button>
      </div>
    </article>
  )
}

function PlannedSprintCard({
  sprint,
  projectId,
  onStart,
}: {
  sprint: Sprint
  projectId: string
  onStart: () => void
}) {
  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-devflow-border bg-devflow-card p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-section-title text-devflow-text">{sprint.name}</h4>
          <SprintStatusBadge status={sprint.status} />
        </div>
        <p className="mt-1 text-caption text-devflow-text-secondary">
          {sprint.dateRange}
        </p>
        {sprint.goal && (
          <p className="mt-1 line-clamp-1 text-caption text-devflow-text-muted">
            {sprint.goal}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white hover:opacity-95"
        >
          Start sprint
        </button>
        <Link
          to={sprintPlanningPath(projectId, sprint.id)}
          className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface"
        >
          Edit
        </Link>
      </div>
    </article>
  )
}

function CompletedSprintCard({
  sprint,
  projectId,
}: {
  sprint: Sprint
  projectId: string
}) {
  const rate = getSprintSuccessRate(sprint)

  return (
    <article className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-devflow-border bg-devflow-card p-4 opacity-95">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-section-title text-devflow-text">{sprint.name}</h4>
          <SprintStatusBadge status="completed" />
        </div>
        <p className="mt-1 text-caption text-devflow-text-secondary">
          {sprint.dateRange} · {rate}% success rate
        </p>
      </div>
      <Link
        to={sprintDetailPath(projectId, sprint.id)}
        className={cn(
          'rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface',
        )}
      >
        View summary
      </Link>
    </article>
  )
}
