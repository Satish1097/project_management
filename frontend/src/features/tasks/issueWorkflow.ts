import { getWorkflowColumns } from '@/services/workflowConfig'
import type { Task, TaskStatus } from '@/types/tasks'

export type { WorkflowColumn } from '@/services/workflowConfig'
export { getWorkflowColumns } from '@/services/workflowConfig'

/** @deprecated Use getWorkflowColumns() for dynamic workflow support. */
export const WORKFLOW_COLUMNS = getWorkflowColumns()

export function groupTasksByStatus(
  tasks: Task[],
  columns = getWorkflowColumns(),
): Record<TaskStatus, Task[]> {
  const grouped = Object.fromEntries(
    columns.map((col) => [col.id, [] as Task[]]),
  ) as Record<TaskStatus, Task[]>

  const fallbackId = columns[0]?.id ?? 'todo'

  for (const task of tasks) {
    const bucket = grouped[task.status]
    if (bucket) {
      bucket.push(task)
    } else {
      grouped[fallbackId].push(task)
    }
  }

  return grouped
}
