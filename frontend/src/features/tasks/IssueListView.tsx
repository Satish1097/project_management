import { TaskListTable } from './TaskListTable'
import type { Task } from '@/types/tasks'

type IssueListViewProps = {
  tasks: Task[]
}

/** List/table presentation — wraps the existing table without altering it. */
export function IssueListView({ tasks }: IssueListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-devflow-border bg-devflow-card px-6 py-16 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <p className="text-body font-medium text-devflow-text">No issues match your filters</p>
        <p className="mt-1 text-caption text-devflow-text-secondary">
          Try adjusting status, priority, or project filters.
        </p>
      </div>
    )
  }

  return <TaskListTable tasks={tasks} />
}
