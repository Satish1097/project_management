import { useOpenIssueFromTask } from '@/contexts/IssueDetailContext'
import { IssueStatusBadge } from '@/components/ui/IssueStatusBadge'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import { SprintBadge } from '@/components/ui/SprintBadge'
import type { Task } from '@/types/tasks'
import { cn } from '@/utils/cn'

const GRID_BASE =
  'grid grid-cols-[48px_120px_minmax(0,1fr)_120px_140px_120px_100px] items-center gap-x-4'

const GRID_WITH_SPRINT =
  'grid grid-cols-[48px_120px_minmax(0,1fr)_120px_120px_140px_120px_100px] items-center gap-x-4'

type TaskListTableProps = {
  tasks: Task[]
  embedded?: boolean
  showSprintColumn?: boolean
}

export function TaskListTable({
  tasks,
  embedded = false,
  showSprintColumn = false,
}: TaskListTableProps) {
  const openIssue = useOpenIssueFromTask()
  const gridClass = showSprintColumn ? GRID_WITH_SPRINT : GRID_BASE
  const table = (
    <>
      <div className={cn(gridClass, 'border-b border-devflow-border bg-devflow-table-header px-4 py-2')}>
        <span className="text-center text-table-header uppercase tracking-wide text-devflow-text-secondary">
          !
        </span>
        <span className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
          ID
        </span>
        <span className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
          Title
        </span>
        <span className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
          Status
        </span>
        {showSprintColumn ? (
          <span className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
            Sprint
          </span>
        ) : null}
        <span className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
          Project
        </span>
        <span className="text-table-header uppercase tracking-wide text-devflow-text-secondary">
          Labels
        </span>
        <span className="text-right text-table-header uppercase tracking-wide text-devflow-text-secondary">
          Due Date
        </span>
      </div>
      {tasks.map((task, index) => {
        const ProjectIcon = task.projectIcon
        return (
          <div
            key={task.id}
            role="button"
            tabIndex={0}
            onClick={() => openIssue(task)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                openIssue(task)
              }
            }}
            className={cn(
              gridClass,
              'cursor-pointer px-4 py-3 transition-colors hover:bg-devflow-surface/80',
              index < tasks.length - 1 && 'border-b border-devflow-border',
            )}
          >
            <PriorityIndicator priority={task.priority} />
            <span className="font-mono text-caption font-medium tracking-[0.24px] text-devflow-text-muted">
              {task.key}
            </span>
            <p className="text-body font-medium text-devflow-text">
              {task.title}
            </p>
            <IssueStatusBadge status={task.status} />
            {showSprintColumn ? (
              <SprintBadge name={task.sprintName ?? null} />
            ) : null}            <div className="flex items-center gap-1 text-body text-devflow-text-secondary">
              <ProjectIcon className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{task.project}</span>
            </div>
            <LabelBadge label={task.label} variant={task.labelVariant} />
            <span
              className={cn(
                'text-right text-table',
                task.dueOverdue
                  ? 'font-bold text-devflow-error'
                  : 'text-devflow-text-secondary',
              )}
            >
              {task.dueDate}
            </span>
          </div>
        )
      })}
    </>
  )

  if (embedded) {
    return table
  }

  return (
    <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      {table}
    </div>
  )
}
