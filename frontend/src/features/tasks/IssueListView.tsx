import { TaskListTable } from './TaskListTable'
import { IssueListPagination } from '@/features/kanban/IssueListPagination'
import type { Task } from '@/types/tasks'

type IssueListPaginationState = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
}

type IssueListViewProps = {
  tasks: Task[]
  pagination?: IssueListPaginationState | null
}

/** List/table presentation — wraps the existing table without altering it. */
export function IssueListView({ tasks, pagination }: IssueListViewProps) {
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

  return (
    <div className="overflow-hidden rounded-lg border border-devflow-border bg-devflow-card shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      <TaskListTable tasks={tasks} embedded />
      {pagination ? (
        <IssueListPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalCount={pagination.totalCount}
          totalPages={pagination.totalPages}
          hasPrevious={pagination.hasPrevious}
          hasNext={pagination.hasNext}
          onPageChange={pagination.onPageChange}
        />
      ) : null}
    </div>
  )
}
