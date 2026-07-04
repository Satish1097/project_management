import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import {
  sprintBoardPath,
  projectBacklogSprintPath,
} from '@/constants/routes'
import { CompleteSprintModal } from '@/features/sprints/CompleteSprintModal'
import { CreateSprintDrawer } from '@/features/sprints/CreateSprintDrawer'
import { useSprintActions } from '@/hooks/useSprintActions'
import { useLoadProjectSprints } from '@/hooks/useLoadProjectSprints'
import { useIssues } from '@/contexts/IssuesContext'
import { useProjectMembersContext } from '@/contexts/ProjectMembersContext'
import { useSprints } from '@/contexts/SprintsContext'
import { projectMembersToAvatarGroup } from '@/features/members/memberUtils'
import {
  formatSprintStatus,
  getProjectById,
  getSprintById,
  getSprintCompletionPercent,
} from '@/services/projectData'
import { getSprintIssues } from '@/services/issuesRegistry'
import { AvatarGroup } from '@/components/ui/AvatarGroup'

export function SprintDetailPage() {
  const { projectId = '', sprintId = '' } = useParams()
  const project = getProjectById(projectId)
  const sprint = getSprintById(projectId, sprintId)
  const { loadSprintDetail } = useSprints()
  const { loading: sprintsLoading } = useLoadProjectSprints(projectId)
  const {
    loadSprintIssues,
    sprintIssuesLoading,
    sprintIssuesError,
  } = useIssues()
  const { startSprint, pauseSprint, resumeSprint, completeSprint } =
    useSprintActions(projectId)
  const { members, loading: membersLoading } = useProjectMembersContext()
  const { members: avatarMembers, extra: avatarExtra } =
    projectMembersToAvatarGroup(members)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)

  useEffect(() => {
    if (!projectId || !sprintId) {
      setDetailLoading(false)
      return
    }

    setDetailLoading(true)
    void Promise.all([
      loadSprintDetail(sprintId, projectId),
      loadSprintIssues(projectId, sprintId),
    ]).finally(() => {
      setDetailLoading(false)
    })
  }, [projectId, sprintId, loadSprintDetail, loadSprintIssues])

  if (!project) {
    return <Navigate to="/projects" replace />
  }

  if ((sprintsLoading || detailLoading || sprintIssuesLoading) && !sprint) {
    return (
      <main className="page-main">
        <p className="text-body text-devflow-text-secondary">Loading sprint…</p>
      </main>
    )
  }

  if (!sprint) {
    return <Navigate to="/projects" replace />
  }

  const pct = getSprintCompletionPercent(sprint)
  const issues = getSprintIssues(projectId, sprintId)
  const teamCount = members.length

  const handleStart = async () => {
    setError(null)
    const result = await startSprint(sprintId)
    if (!result.ok) setError(result.message)
  }

  const handlePause = async () => {
    setError(null)
    const result = await pauseSprint(sprintId)
    if (!result.ok) setError(result.message)
  }

  const handleResume = async () => {
    setError(null)
    const result = await resumeSprint(sprintId)
    if (!result.ok) setError(result.message)
  }

  return (
    <main className="page-main">
      <div className="page-stack max-w-3xl">
        {error && (
          <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
            {error}
          </p>
        )}

        {sprintIssuesError && (
          <p className="rounded-lg border border-devflow-error/30 bg-devflow-danger-bg px-3 py-2 text-caption text-devflow-error">
            {sprintIssuesError}
          </p>
        )}

        <div className="rounded-lg border border-devflow-border bg-devflow-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-page-title text-devflow-text">{sprint.name}</h2>
                <SprintStatusBadge status={sprint.status} />
              </div>
              <p className="mt-1 text-body text-devflow-text-secondary">
                {formatSprintStatus(sprint.status)} · {sprint.dateRange}
              </p>
            </div>
            <div className="text-right">
              <p className="text-caption text-devflow-text-muted">Completion</p>
              <p className="text-metric text-devflow-primary">{pct}%</p>
            </div>
          </div>

          {sprint.goal && (
            <div className="mt-4 rounded-lg bg-devflow-surface px-3 py-2">
              <p className="text-caption font-medium text-devflow-text-muted">
                Sprint goal
              </p>
              <p className="mt-1 text-body text-devflow-text">{sprint.goal}</p>
            </div>
          )}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-devflow-progress-track">
            <div
              className="h-full rounded-full bg-devflow-success"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Total issues" value={String(sprint.issueCount)} />
            <Metric label="Completed" value={String(sprint.completedCount)} />
            <Metric
              label="Capacity"
              value={
                sprint.capacityPoints
                  ? `${sprint.capacityPoints} pts`
                  : '—'
              }
            />
            <Metric
              label="Days left"
              value={
                sprint.daysRemaining != null
                  ? String(sprint.daysRemaining)
                  : '—'
              }
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-caption text-devflow-text-secondary">Team</span>
            <AvatarGroup members={avatarMembers} extra={avatarExtra} projectId={projectId} />
            <span className="text-caption text-devflow-text-muted">
              {membersLoading ? '—' : `${teamCount} members`}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {sprint.status === 'planned' && (
              <>
                <button
                  type="button"
                  onClick={() => void handleStart()}
                  className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white hover:opacity-95"
                >
                  Start sprint
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface"
                >
                  Edit sprint
                </button>
                <Link
                  to={projectBacklogSprintPath(projectId, sprintId)}
                  className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text hover:bg-devflow-surface"
                >
                  Plan sprint
                </Link>
              </>
            )}
            {sprint.status === 'active' && (
              <>
                <Link
                  to={sprintBoardPath(projectId, sprintId)}
                  className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white hover:opacity-95"
                >
                  Open board
                </Link>
                <button
                  type="button"
                  onClick={() => void handlePause()}
                  className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-surface"
                >
                  Pause sprint
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteOpen(true)}
                  className="rounded-lg border border-devflow-border px-3 py-1.5 text-btn text-devflow-text-secondary hover:bg-devflow-surface"
                >
                  Complete sprint
                </button>
              </>
            )}
            {sprint.status === 'paused' && (
              <button
                type="button"
                onClick={() => void handleResume()}
                className="rounded-lg bg-devflow-primary px-3 py-1.5 text-btn text-white"
              >
                Resume sprint
              </button>
            )}
          </div>
        </div>

        <section className="rounded-lg border border-devflow-border bg-devflow-card p-4">
          <h3 className="text-section-title text-devflow-text">Burndown</h3>
          <p className="mt-2 text-body text-devflow-text-secondary">
            Burndown chart integration coming soon. Track daily progress against
            sprint capacity here.
          </p>
          <div className="mt-4 flex h-32 items-end gap-1 rounded-lg bg-devflow-surface px-3 pb-2">
            {[72, 65, 58, 52, 45, 38, pct].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-devflow-primary/70"
                style={{ height: `${Math.max(8, h)}%` }}
              />
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-section-title text-devflow-text">
            Sprint issues ({issues.length})
          </h3>
          <ul className="flex flex-col gap-2">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-devflow-border bg-devflow-card px-3 py-2"
              >
                <span className="font-mono text-caption text-devflow-text-muted">
                  {issue.key}
                </span>
                <p className="text-body text-devflow-text">{issue.title}</p>
              </li>
            ))}
            {issues.length === 0 && (
              <li className="text-body text-devflow-text-muted">
                No issues in this sprint.{' '}
                <Link
                  to={projectBacklogSprintPath(projectId, sprintId)}
                  className="text-devflow-primary hover:underline"
                >
                  Add from backlog
                </Link>
              </li>
            )}
          </ul>
        </section>
      </div>

      <CompleteSprintModal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        projectId={projectId}
        sprint={sprint}
        onComplete={(opts) => completeSprint(sprintId, opts)}
      />

      <CreateSprintDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        projectId={projectId}
        sprintToEdit={sprint}
      />
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-devflow-border/80 bg-devflow-surface px-3 py-2">
      <p className="text-caption text-devflow-text-muted">{label}</p>
      <p className="text-metric text-devflow-text">{value}</p>
    </div>
  )
}
