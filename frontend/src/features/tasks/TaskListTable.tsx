import { IssueStatusBadge } from '@/components/ui/IssueStatusBadge'
import { LabelBadge } from '@/components/ui/LabelBadge'
import { PriorityIndicator } from '@/components/ui/PriorityIndicator'
import type { Task } from '@/types/tasks'
import { cn } from '@/utils/cn'

const GRID =
  'grid grid-cols-[48px_120px_minmax(0,1fr)_120px_140px_120px_100px] items-center gap-x-4'

type TaskListTableProps = {
  tasks: Task[]
}

export function TaskListTable({ tasks }: TaskListTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-devflow-border bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <div className={cn(GRID, 'border-b border-devflow-border bg-[#eceef0] px-4 py-2')}>
        <span className="text-center text-table-header uppercase tracking-wide text-[#424753]">
          !
        </span>
        <span className="text-table-header uppercase tracking-wide text-[#424753]">
          ID
        </span>
        <span className="text-table-header uppercase tracking-wide text-[#424753]">
          Title
        </span>
        <span className="text-table-header uppercase tracking-wide text-[#424753]">
          Status
        </span>
        <span className="text-table-header uppercase tracking-wide text-[#424753]">
          Project
        </span>
        <span className="text-table-header uppercase tracking-wide text-[#424753]">
          Labels
        </span>
        <span className="text-right text-table-header uppercase tracking-wide text-[#424753]">
          Due Date
        </span>
      </div>

      {tasks.map((task, index) => {
        const ProjectIcon = task.projectIcon
        return (
          <div
            key={task.id}
            className={cn(
              GRID,
              'px-4 py-3',
              index < tasks.length - 1 && 'border-b border-devflow-border',
            )}
          >
            <PriorityIndicator priority={task.priority} />
            <span className="font-mono text-caption font-medium tracking-[0.24px] text-[#727784]">
              {task.key}
            </span>
            <p className="text-body font-medium text-devflow-text">
              {task.title}
            </p>
            <IssueStatusBadge status={task.status} />
            <div className="flex items-center gap-1 text-body text-[#424753]">
              <ProjectIcon className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{task.project}</span>
            </div>
            <LabelBadge label={task.label} variant={task.labelVariant} />
            <span
              className={cn(
                'text-right text-table',
                task.dueOverdue
                  ? 'font-bold text-[#ba1a1a]'
                  : 'text-[#424753]',
              )}
            >
              {task.dueDate}
            </span>
          </div>
        )
      })}
    </div>
  )
}
