import type { TaskStatus } from '@/types/tasks'

export type WorkflowColumn = {
  id: TaskStatus
  title: string
  /** Compact header label, e.g. TODO • 2 */
  headerLabel: string
  emptyMessage: string
  dotColor: string
  accent: string
}

const EMPTY_MESSAGE = 'No issues in this status'

/** Default workflow columns — source of truth until project settings API is wired. */
export const DEFAULT_WORKFLOW_COLUMNS: WorkflowColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    headerLabel: 'BACKLOG',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-backlog)',
    accent: 'var(--df-kanban-accent-backlog)',
  },
  {
    id: 'todo',
    title: 'Todo',
    headerLabel: 'TODO',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-todo)',
    accent: 'var(--df-kanban-accent-todo)',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    headerLabel: 'IN PROGRESS',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-progress)',
    accent: 'var(--df-kanban-accent-progress)',
  },
  {
    id: 'review',
    title: 'Review',
    headerLabel: 'REVIEW',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-review)',
    accent: 'var(--df-kanban-accent-review)',
  },
  {
    id: 'testing',
    title: 'Testing / QA',
    headerLabel: 'TESTING / QA',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-testing)',
    accent: 'var(--df-kanban-accent-testing)',
  },
  {
    id: 'blocked',
    title: 'Blocked',
    headerLabel: 'BLOCKED',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-blocked)',
    accent: 'var(--df-kanban-accent-blocked)',
  },
  {
    id: 'done',
    title: 'Done',
    headerLabel: 'DONE',
    emptyMessage: EMPTY_MESSAGE,
    dotColor: 'var(--df-kanban-status-done)',
    accent: 'var(--df-kanban-accent-done)',
  },
]

const projectWorkflowOverrides = new Map<string, WorkflowColumn[]>()

/** Returns workflow columns for a project (dynamic; overridable from settings). */
export function getWorkflowColumns(projectId?: string): WorkflowColumn[] {
  if (projectId && projectWorkflowOverrides.has(projectId)) {
    return projectWorkflowOverrides.get(projectId)!
  }
  return DEFAULT_WORKFLOW_COLUMNS
}

/** Register custom workflow columns for a project (e.g. from admin settings). */
export function setProjectWorkflowColumns(
  projectId: string,
  columns: WorkflowColumn[],
): void {
  projectWorkflowOverrides.set(projectId, columns)
}

export function workflowColumnIds(projectId?: string): TaskStatus[] {
  return getWorkflowColumns(projectId).map((col) => col.id)
}
