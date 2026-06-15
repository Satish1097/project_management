import type { KanbanColumn } from '@/types/kanban'

export const kanbanColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'TODO',
    dotColor: '#727785',
    count: 3,
    issues: [
      {
        id: '1',
        key: 'DF-101',
        title: 'Implement OAuth2 Flow for external partners',
        priority: 'high',
        priorityLevel: 'high',
        label: 'Frontend',
        labels: ['frontend'],
        assigneeId: 'member-alex',
        assignee: { name: 'Alex', color: '#6366f1' },
      },
      {
        id: '2',
        key: 'DF-104',
        title: 'Update documentation for API v2 endpoints',
        priority: 'low',
        priorityLevel: 'low',
        label: 'Docs',
        labels: [],
        assigneeId: 'member-sam',
        assignee: { name: 'Sam', color: '#ec4899' },
      },
    ],
  },
  {
    id: 'in_progress',
    title: 'IN PROGRESS',
    dotColor: '#0058be',
    count: 2,
    issues: [
      {
        id: '3',
        key: 'DF-102',
        title: 'Refactor database schema for user profiles',
        priority: 'medium',
        priorityLevel: 'medium',
        label: 'Backend',
        labels: ['backend'],
        assigneeId: 'member-jordan',
        assignee: { name: 'Jordan', color: '#f59e0b' },
        progress: 65,
      },
    ],
  },
  {
    id: 'done',
    title: 'DONE',
    dotColor: '#10b981',
    count: 12,
    issues: [
      {
        id: '4',
        key: 'DF-098',
        title: 'Fix memory leak in websocket listener',
        label: 'Critical-Fix',
        labels: ['bug'],
        assigneeId: 'member-riley',
        assignee: { name: 'Riley', color: '#14b8a6' },
        done: true,
      },
    ],
  },
]

export const boardFilters = {
  assignees: ['Alex', 'Sam', 'Jordan', 'Riley'],
}
