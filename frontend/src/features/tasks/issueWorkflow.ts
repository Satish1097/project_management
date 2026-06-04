import type { Task, TaskStatus } from '@/types/tasks'

export type WorkflowColumn = {
  id: TaskStatus
  title: string
  /** Compact header label, e.g. TODO • 2 */
  headerLabel: string
  emptyMessage: string
  dotColor: string
  accent: string
}

/** Ordered workflow columns — reusable for sprint boards later. */
export const WORKFLOW_COLUMNS: WorkflowColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    headerLabel: 'BACKLOG',
    emptyMessage: 'No backlog issues',
    dotColor: 'var(--df-kanban-status-backlog)',
    accent: 'var(--df-kanban-accent-backlog)',
  },
  {
    id: 'todo',
    title: 'Todo',
    headerLabel: 'TODO',
    emptyMessage: 'No todo issues',
    dotColor: 'var(--df-kanban-status-todo)',
    accent: 'var(--df-kanban-accent-todo)',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    headerLabel: 'IN PROGRESS',
    emptyMessage: 'No in progress issues',
    dotColor: 'var(--df-kanban-status-progress)',
    accent: 'var(--df-kanban-accent-progress)',
  },
  {
    id: 'review',
    title: 'Review / Testing',
    headerLabel: 'REVIEW',
    emptyMessage: 'No review issues',
    dotColor: 'var(--df-kanban-status-review)',
    accent: 'var(--df-kanban-accent-review)',
  },
  {
    id: 'done',
    title: 'Done',
    headerLabel: 'DONE',
    emptyMessage: 'No done issues',
    dotColor: 'var(--df-kanban-status-done)',
    accent: 'var(--df-kanban-accent-done)',
  },
]

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped = Object.fromEntries(
    WORKFLOW_COLUMNS.map((col) => [col.id, [] as Task[]]),
  ) as Record<TaskStatus, Task[]>

  for (const task of tasks) {
    grouped[task.status].push(task)
  }

  return grouped
}
