import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { sprintPlanningPath } from '@/constants/routes'
import { useSprints } from '@/contexts/SprintsContext'
import type { Sprint } from '@/types/sprints'
import { cn } from '@/utils/cn'

type BacklogSprintSidebarProps = {
  projectId: string
  sprints: Sprint[]
  draggingId: string | null
  onDropToSprint: (sprintId: string) => void
  className?: string
}

export function BacklogSprintSidebar({
  projectId,
  sprints,
  draggingId,
  onDropToSprint,
  className,
}: BacklogSprintSidebarProps) {
  const { recentlyCreatedSprintId } = useSprints()

  if (sprints.length === 0) return null

  return (
    <aside
      className={cn(
        'w-full shrink-0 lg:sticky lg:top-[7.5rem] lg:w-44 lg:self-start',
        className,
      )}
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-devflow-text-muted">
        Sprints
      </p>
      <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col">
        {sprints.map((sprint) => (
          <div
            key={sprint.id}
            data-sprint-id={sprint.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              onDropToSprint(sprint.id)
            }}
            className={cn(
              'backlog-sprint-drop-target min-w-[9rem] flex-1 rounded border border-devflow-border/70',
              'bg-devflow-surface/60 px-2 py-1.5 lg:flex-none lg:min-w-0',
              draggingId && 'backlog-sprint-drop-target--active',
              recentlyCreatedSprintId === sprint.id && 'sprint-card-highlight',
            )}
          >
            <div className="flex items-baseline justify-between gap-1.5">
              <p className="truncate text-[12px] font-medium text-devflow-text">
                {sprint.name}
              </p>
              <span className="shrink-0 text-[10px] tabular-nums text-devflow-text-muted">
                {sprint.issueCount}
              </span>
            </div>
            <p className="text-[10px] text-devflow-text-muted">
              {sprint.issueCount === 1 ? 'issue' : 'issues'}
            </p>
            <Link
              to={sprintPlanningPath(projectId, sprint.id)}
              className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-devflow-primary hover:underline"
            >
              Planning
              <ArrowRight className="size-2.5" aria-hidden />
            </Link>
          </div>
        ))}
      </div>
    </aside>
  )
}
