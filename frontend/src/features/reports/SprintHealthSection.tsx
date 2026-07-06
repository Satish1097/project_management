import { SprintStatusBadge } from '@/components/ui/SprintStatusBadge'
import type { SprintHealthApi } from '@/api/projects'
import type { SprintStatus } from '@/types/sprints'
import { layout } from '@/constants/layout'

type SprintHealthSectionProps = {
  items: SprintHealthApi[]
  loading: boolean
  error: string | null
}

export function SprintHealthSection({
  items,
  loading,
  error,
}: SprintHealthSectionProps) {
  if (loading) {
    return (
      <section className={layout.uiCard}>
        <h3 className="text-section-title text-devflow-text">Sprint Health</h3>
        <p className="mt-2 text-body text-devflow-text-secondary">Loading sprint health…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className={layout.uiCard}>
        <h3 className="text-section-title text-devflow-text">Sprint Health</h3>
        <p className="mt-2 text-caption text-devflow-error">{error}</p>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className={layout.uiCard}>
        <h3 className="text-section-title text-devflow-text">Sprint Health</h3>
        <p className="mt-2 text-body text-devflow-text-secondary">
          No sprints yet. Create and start a sprint to track health metrics here.
        </p>
      </section>
    )
  }

  return (
    <section className={layout.uiCard}>
      <h3 className="text-section-title text-devflow-text">Sprint Health</h3>
      <p className="mt-1 text-body text-devflow-text-secondary">
        Committed vs completed story points and issue progress per sprint.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((sprint) => (
          <li
            key={sprint.sprint_id}
            className="rounded-lg border border-devflow-border bg-devflow-surface px-4 py-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body font-medium text-devflow-text">
                  {sprint.sprint_name}
                </span>
                <SprintStatusBadge status={sprint.sprint_status as SprintStatus} />
              </div>
              <span className="text-metric text-devflow-primary">
                {sprint.progress_percentage}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-devflow-progress-track">
              <div
                className="h-full rounded-full bg-devflow-success"
                style={{ width: `${sprint.progress_percentage}%` }}
              />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              <HealthMetric
                label="Issues"
                value={`${sprint.completed_issues}/${sprint.total_issues}`}
              />
              <HealthMetric
                label="Story points"
                value={`${sprint.completed_story_points}/${sprint.committed_story_points}`}
              />
              <HealthMetric
                label="Remaining pts"
                value={String(sprint.remaining_story_points)}
              />
              <HealthMetric
                label="In progress"
                value={String(sprint.in_progress_issues)}
              />
            </dl>
          </li>
        ))}
      </ul>
    </section>
  )
}

function HealthMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-devflow-text-muted">{label}</dt>
      <dd className="text-body tabular-nums text-devflow-text">{value}</dd>
    </div>
  )
}
