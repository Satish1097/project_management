import type {
  IssueFilters,
  IssueSortKey,
  Task,
  TaskPriority,
} from '@/types/tasks'

const priorityOrder: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
}

export type AssigneeTab = 'assigned' | 'created' | 'watching'

export function filterByAssigneeTab(
  tasks: Task[],
  tab: AssigneeTab,
): Task[] {
  switch (tab) {
    case 'assigned':
      return tasks.filter((t) => t.assignee.name === 'You')
    case 'created':
      return tasks.filter((t) =>
        ['DEV-1102', 'DEV-1140', 'DEV-1031'].includes(t.key),
      )
    case 'watching':
      return tasks.filter((t) =>
        ['DEV-1130', 'DEV-1098', 'DEV-1085', 'DEV-1124'].includes(t.key),
      )
    default:
      return tasks
  }
}

export function applyIssueFilters(
  tasks: Task[],
  filters: IssueFilters,
): Task[] {
  return tasks.filter((task) => {
    if (filters.status !== 'all' && task.status !== filters.status) {
      return false
    }
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false
    }
    if (filters.project !== 'all' && task.project !== filters.project) {
      return false
    }
    return true
  })
}

export function sortIssues(tasks: Task[], sortKey: IssueSortKey): Task[] {
  if (sortKey === 'default') {
    return tasks
  }

  const sorted = [...tasks]

  if (sortKey === 'priority') {
    sorted.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    )
  } else if (sortKey === 'title') {
    sorted.sort((a, b) => a.title.localeCompare(b.title))
  } else if (sortKey === 'dueDate') {
    sorted.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }

  return sorted
}
