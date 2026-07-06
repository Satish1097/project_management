import { CURRENT_USER } from '@/constants/currentUser'
import { demoMembers } from '@/services/demoData'
import type { IssueDetailExtras } from '@/types/issueDetail'
import type { ProjectIssue } from '@/types/issues'

const store = new Map<string, IssueDetailExtras>()

function memberByName(name: string) {
  const found = demoMembers.find(
    (m) => m.name.toLowerCase().startsWith(name.toLowerCase().split(' ')[0]),
  )
  return found
    ? { name: found.name, color: found.color }
    : { name, color: '#6366f1' }
}

function seedExtras(issue: ProjectIssue): IssueDetailExtras {
  const reporter = issue.assignee
  const now = new Date()
  const created = new Date(now.getTime() - 1000 * 60 * 60 * 24 * (3 + (issue.id.length % 10)))
  const updated = new Date(now.getTime() - 1000 * 60 * 60 * (2 + (issue.id.length % 5)))

  const statusLabel =
    issue.workflowStatus === 'in_progress'
      ? 'In Progress'
      : issue.workflowStatus === 'done'
        ? 'Done'
        : issue.workflowStatus === 'review'
          ? 'Review'
          : 'Todo'

  return {
    description:
      issue.description ??
      `${issue.title}. Track implementation notes, dependencies, and rollout steps here.`,
    acceptanceCriteria:
      issue.acceptanceCriteria ??
      '- Acceptance criteria are defined and reviewed\n- QA sign-off on staging\n- Documentation updated',
    epic: issue.key.split('-')[0] + '-EPIC-1',
    reporter,
    createdBy: CURRENT_USER.name,
    createdAt: created.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    updatedAt: updated.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    activity: [
      {
        id: `${issue.id}-a1`,
        type: 'created',
        actor: memberByName(CURRENT_USER.name),
        message: `created ${issue.key}`,
        timestamp: '3 days ago',
      },
      {
        id: `${issue.id}-a2`,
        type: 'status_changed',
        actor: issue.assignee,
        message: `changed status to ${statusLabel}`,
        timestamp: '2 hours ago',
      },
      {
        id: `${issue.id}-a3`,
        type: 'assignee_updated',
        actor: memberByName('Sarah'),
        message: `assigned to ${issue.assignee.name}`,
        timestamp: 'Yesterday',
      },
    ],
    comments: [
      {
        id: `${issue.id}-c1`,
        author: issue.assignee,
        body: 'Started on the API contract — will share the OpenAPI diff shortly.',
        timestamp: '4 hours ago',
      },
    ],
    subtasks: [
      { id: `${issue.id}-s1`, title: 'Define scope and acceptance criteria', done: true },
      { id: `${issue.id}-s2`, title: 'Implement core changes', done: issue.status !== 'todo' },
      { id: `${issue.id}-s3`, title: 'Add tests and documentation', done: issue.status === 'done' },
    ],
  }
}

export function getIssueDetailExtras(issue: ProjectIssue): IssueDetailExtras {
  const existing = store.get(issue.id)
  if (existing) return existing
  const seeded = seedExtras(issue)
  store.set(issue.id, seeded)
  return seeded
}

export function updateIssueDetailExtras(
  issueId: string,
  patch: Partial<IssueDetailExtras>,
): IssueDetailExtras | undefined {
  const current = store.get(issueId)
  if (!current) return undefined
  const next = { ...current, ...patch, updatedAt: new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }) }
  store.set(issueId, next)
  return next
}
