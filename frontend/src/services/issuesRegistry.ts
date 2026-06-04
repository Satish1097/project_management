import { mockIssues } from '@/services/mockIssues'
import type { ProjectIssue } from '@/types/issues'
import type { KanbanColumn, KanbanIssue } from '@/types/kanban'
import type { Sprint } from '@/types/sprints'

let issues: ProjectIssue[] = [...mockIssues]

export function getIssues(): ProjectIssue[] {
  return issues
}

export function getIssueById(issueId: string): ProjectIssue | undefined {
  return issues.find((i) => i.id === issueId)
}

export function getIssueByKey(key: string): ProjectIssue | undefined {
  const normalized = key.trim().toUpperCase()
  return issues.find((i) => i.key.toUpperCase() === normalized)
}

export function updateIssueInRegistry(
  issueId: string,
  patch: Partial<ProjectIssue>,
): ProjectIssue | undefined {
  const index = issues.findIndex((i) => i.id === issueId)
  if (index < 0) return undefined
  const updated = { ...issues[index], ...patch }
  issues = [...issues.slice(0, index), updated, ...issues.slice(index + 1)]
  return updated
}

export function generateIssueKey(
  projectKey: string,
  projectId: string,
): string {
  const prefix = projectKey.toUpperCase()
  const maxNum = issues
    .filter((i) => i.projectId === projectId)
    .reduce((max, issue) => {
      const match = issue.key.match(/-(\d+)$/)
      return match ? Math.max(max, Number(match[1])) : max
    }, 100)
  return `${prefix}-${maxNum + 1}`
}

export function addIssueToRegistry(issue: ProjectIssue): void {
  issues = [...issues, issue]
}

export function getBacklogIssues(projectId: string): ProjectIssue[] {
  return issues.filter((i) => i.projectId === projectId && i.sprintId === null)
}

export function getSprintIssues(
  projectId: string,
  sprintId: string,
): ProjectIssue[] {
  return issues.filter(
    (i) => i.projectId === projectId && i.sprintId === sprintId,
  )
}

export function assignIssueToSprint(
  issueId: string,
  sprintId: string | null,
): void {
  issues = issues.map((i) =>
    i.id === issueId ? { ...i, sprintId } : i,
  )
}

export function moveIssuesToSprint(
  issueIds: string[],
  sprintId: string | null,
): void {
  const set = new Set(issueIds)
  issues = issues.map((i) =>
    set.has(i.id) ? { ...i, sprintId } : i,
  )
}

export function syncSprintIssueCounts(sprint: Sprint): Sprint {
  const sprintIssues = getSprintIssues(sprint.projectId, sprint.id)
  const completed = sprintIssues.filter(
    (i) => i.done || i.status === 'done',
  ).length
  return {
    ...sprint,
    issueCount: sprintIssues.length,
    completedCount: completed,
  }
}

export function getKanbanColumnsForSprint(
  projectId: string,
  sprintId: string,
): KanbanColumn[] {
  const sprintIssues = getSprintIssues(projectId, sprintId)
  const columns: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'TODO',
      dotColor: '#727785',
      count: 0,
      issues: [],
    },
    {
      id: 'in_progress',
      title: 'IN PROGRESS',
      dotColor: '#0058be',
      count: 0,
      issues: [],
    },
    {
      id: 'done',
      title: 'DONE',
      dotColor: '#10b981',
      count: 0,
      issues: [],
    },
  ]

  for (const issue of sprintIssues) {
    const col = columns.find((c) => c.id === issue.status) ?? columns[0]
    const kanbanIssue: KanbanIssue = {
      id: issue.id,
      key: issue.key,
      title: issue.title,
      priority: issue.priority,
      label: issue.label,
      assignee: issue.assignee,
      progress: issue.progress,
      done: issue.done,
    }
    col.issues.push(kanbanIssue)
    col.count = col.issues.length
  }

  return columns
}
