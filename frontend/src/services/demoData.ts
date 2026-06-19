import type { Project } from '@/types/projects'
import type { ProjectIssue, IssueBoardStatus } from '@/types/issues'
import type { Sprint } from '@/types/sprints'
import { computeSprintProgress, formatDateRange } from '@/utils/sprintDates'

export type WorkspaceMember = {
  id: string
  name: string
  email: string
  role: string
  color: string
}

// ─── Members ───────────────────────────────────────────────────────────────────

export const demoMembers: WorkspaceMember[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    email: 'alex@devflow.io',
    role: 'Owner',
    color: '#6366f1',
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah@devflow.io',
    role: 'Admin',
    color: '#ec4899',
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    email: 'marcus@devflow.io',
    role: 'Member',
    color: '#f59e0b',
  },
  {
    id: '4',
    name: 'Luna Park',
    email: 'luna@devflow.io',
    role: 'Member',
    color: '#14b8a6',
  },
  {
    id: '5',
    name: 'Jordan Lee',
    email: 'jordan@devflow.io',
    role: 'Member',
    color: '#8b5cf6',
  },
  {
    id: '6',
    name: 'Riley Kim',
    email: 'riley@devflow.io',
    role: 'Member',
    color: '#0ea5e9',
  },
]

const assigneePool = [
  { name: 'Alex', color: '#6366f1' },
  { name: 'Sarah', color: '#ec4899' },
  { name: 'Marcus', color: '#f59e0b' },
  { name: 'Luna', color: '#14b8a6' },
  { name: 'Jordan', color: '#8b5cf6' },
  { name: 'Riley', color: '#0ea5e9' },
] as const

// ─── Projects ────────────────────────────────────────────────────────────────

export const demoProjects: Project[] = [
  {
    id: '1',
    key: 'MOB',
    name: 'Mobile App',
    description:
      'Cross-platform iOS and Android client — authentication, notifications, and offline support.',
    status: 'active',
    icon: 'mobile',
    issuesLabel: '24 Open Issues',
    openIssuesLabel: '24 Open Issues',
    progress: 68,
    recentActivity: 'Sarah moved MOB-118 to Done',
    members: [
      { name: 'Alex', color: '#6366f1' },
      { name: 'Sarah', color: '#ec4899' },
    ],
    extraMembers: 3,
    isMember: true,
    isFavorite: true,
  },
  {
    id: '2',
    key: 'MKT',
    name: 'Marketing Site',
    description: 'Q3 landing page redesign, pricing, and SEO for the product launch.',
    status: 'active',
    icon: 'web',
    issuesLabel: '8 Open Issues',
    openIssuesLabel: '8 Open Issues',
    progress: 42,
    recentActivity: 'Luna published hero section preview',
    members: [{ name: 'Luna', color: '#14b8a6' }],
    extraMembers: 2,
    isMember: true,
    isFavorite: true,
  },
  {
    id: '3',
    key: 'API',
    name: 'API Service',
    description: 'Microservice mesh for auth, payments, and event-driven integrations.',
    status: 'at_risk',
    icon: 'api',
    issuesLabel: '18 Planned Issues',
    issuesCritical: true,
    openIssuesLabel: '18 In planning',
    progress: 45,
    recentActivity: 'Jordan flagged webhook timeout in staging',
    members: [
      { name: 'Jordan', color: '#8b5cf6' },
      { name: 'Riley', color: '#0ea5e9' },
    ],
    extraMembers: 1,
    isMember: true,
  },
  {
    id: '4',
    key: 'ADM',
    name: 'Internal Admin Portal',
    description: 'Operations console for support, billing overrides, and audit trails.',
    status: 'active',
    icon: 'web',
    issuesLabel: '14 Open Issues',
    openIssuesLabel: '14 Open Issues',
    progress: 55,
    recentActivity: 'Marcus shipped role-based access controls',
    members: [
      { name: 'Marcus', color: '#f59e0b' },
      { name: 'Alex', color: '#6366f1' },
    ],
    isMember: true,
  },
  {
    id: '5',
    key: 'AIA',
    name: 'AI Automation Platform',
    description: 'Workflow orchestration, model routing, and observability for agent pipelines.',
    status: 'planning',
    icon: 'api',
    issuesLabel: '22 Open Issues',
    openIssuesLabel: '22 Open Issues',
    progress: 28,
    recentActivity: 'Sprint 1 planning workshop scheduled',
    members: [
      { name: 'Sarah', color: '#ec4899' },
      { name: 'Riley', color: '#0ea5e9' },
    ],
    extraMembers: 4,
    isMember: true,
    isFavorite: true,
  },
]

// ─── Sprints (raw) ───────────────────────────────────────────────────────────

type RawSprint = Omit<
  Sprint,
  'dateRange' | 'remainingCount' | 'inProgressCount' | 'progressPercentage'
>

const rawSprints: RawSprint[] = [
  // Mobile App
  {
    id: 'sprint-42',
    projectId: '1',
    name: 'Sprint 42',
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-06-14',
    daysRemaining: 14,
    issueCount: 24,
    completedCount: 16,
    goal: 'Complete authentication and notification module',
    capacityPoints: 55,
    durationWeeks: '2',
  },
  {
    id: 'sprint-43',
    projectId: '1',
    name: 'Sprint 43',
    status: 'planned',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    issueCount: 11,
    completedCount: 0,
    goal: 'Offline support and performance tuning',
    capacityPoints: 40,
    durationWeeks: '2',
  },
  {
    id: 'sprint-41',
    projectId: '1',
    name: 'Sprint 41',
    status: 'completed',
    startDate: '2026-05-19',
    endDate: '2026-06-01',
    issueCount: 20,
    completedCount: 18,
    goal: 'Authentication hardening and session management',
    durationWeeks: '2',
  },
  // Marketing Site
  {
    id: 'sprint-10',
    projectId: '2',
    name: 'Sprint 10',
    status: 'active',
    startDate: '2026-06-04',
    endDate: '2026-06-18',
    daysRemaining: 12,
    issueCount: 8,
    completedCount: 3,
    goal: 'Pricing page and conversion tracking',
    durationWeeks: '2',
  },
  {
    id: 'sprint-7',
    projectId: '2',
    name: 'Sprint 7',
    status: 'planned',
    startDate: '2026-06-19',
    endDate: '2026-07-03',
    issueCount: 6,
    completedCount: 0,
    goal: 'Blog integration and SEO metadata',
    durationWeeks: '2',
  },
  {
    id: 'sprint-8',
    projectId: '2',
    name: 'Sprint 8',
    status: 'completed',
    startDate: '2026-05-20',
    endDate: '2026-06-03',
    issueCount: 12,
    completedCount: 11,
    goal: 'Q3 landing page redesign',
    durationWeeks: '2',
  },
  // API Service
  {
    id: 'sprint-16',
    projectId: '3',
    name: 'Sprint 16',
    status: 'active',
    startDate: '2026-06-02',
    endDate: '2026-06-16',
    daysRemaining: 11,
    issueCount: 26,
    completedCount: 11,
    goal: 'Payment webhook reliability and idempotency keys',
    capacityPoints: 55,
    durationWeeks: '2',
  },
  {
    id: 'sprint-15',
    projectId: '3',
    name: 'Sprint 15',
    status: 'planned',
    startDate: '2026-06-17',
    endDate: '2026-06-30',
    issueCount: 18,
    completedCount: 0,
    goal: 'Refactor authentication and payment APIs',
    capacityPoints: 50,
    durationWeeks: '2',
  },
  {
    id: 'sprint-14',
    projectId: '3',
    name: 'Sprint 14',
    status: 'completed',
    startDate: '2026-05-18',
    endDate: '2026-05-31',
    issueCount: 38,
    completedCount: 35,
    goal: 'Event mesh migration phase 1',
    durationWeeks: '2',
  },
  // Internal Admin Portal
  {
    id: 'sprint-adm-3',
    projectId: '4',
    name: 'Sprint 3',
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-06-14',
    daysRemaining: 10,
    issueCount: 14,
    completedCount: 6,
    goal: 'Support ticket escalation and SLA dashboards',
    durationWeeks: '2',
  },
  {
    id: 'sprint-adm-4',
    projectId: '4',
    name: 'Sprint 4',
    status: 'planned',
    startDate: '2026-06-15',
    endDate: '2026-06-28',
    issueCount: 9,
    completedCount: 0,
    goal: 'Billing override audit log export',
    durationWeeks: '2',
  },
  {
    id: 'sprint-adm-2',
    projectId: '4',
    name: 'Sprint 2',
    status: 'completed',
    startDate: '2026-05-12',
    endDate: '2026-05-26',
    issueCount: 16,
    completedCount: 15,
    goal: 'RBAC for internal operators',
    durationWeeks: '2',
  },
  // AI Automation Platform
  {
    id: 'sprint-aia-2',
    projectId: '5',
    name: 'Sprint 2',
    status: 'active',
    startDate: '2026-06-03',
    endDate: '2026-06-17',
    daysRemaining: 13,
    issueCount: 22,
    completedCount: 8,
    goal: 'Agent workflow DSL and retry policies',
    capacityPoints: 60,
    durationWeeks: '2',
  },
  {
    id: 'sprint-aia-3',
    projectId: '5',
    name: 'Sprint 3',
    status: 'planned',
    startDate: '2026-06-18',
    endDate: '2026-07-01',
    issueCount: 15,
    completedCount: 0,
    goal: 'Model routing cost controls and quotas',
    durationWeeks: '2',
  },
  {
    id: 'sprint-aia-1',
    projectId: '5',
    name: 'Sprint 1',
    status: 'completed',
    startDate: '2026-05-15',
    endDate: '2026-05-29',
    issueCount: 19,
    completedCount: 17,
    goal: 'Pipeline observability MVP',
    durationWeeks: '2',
  },
]

export const demoSprints: Sprint[] = rawSprints.map((s) => {
  const remainingCount = Math.max(0, s.issueCount - s.completedCount)
  const progressPercentage = computeSprintProgress(s.completedCount, s.issueCount)
  return {
    ...s,
    dateRange: formatDateRange(s.startDate, s.endDate),
    remainingCount,
    inProgressCount: 0,
    progressPercentage,
  }
})

// ─── Issue seeds ─────────────────────────────────────────────────────────────

const issueTitles = [
  'Implement OAuth2 integration',
  'Fix refresh token race condition',
  'Add Redis caching layer',
  'Improve analytics dashboard',
  'Setup CI/CD pipeline',
  'Audit third-party dependencies',
  'Fix websocket memory leak',
  'Harden password reset flow',
  'Add rate limiting middleware',
  'Migrate legacy session store',
  'Write integration tests for webhooks',
  'Optimize bundle size for mobile',
  'Add dark mode theme tokens',
  'Implement feature flag service',
  'Document API error contracts',
  'Fix N+1 query in user feed',
  'Add structured logging',
  'Ship push notification templates',
  'Validate PCI scope for payments',
  'Add canary deployment hooks',
  'Improve sprint burndown accuracy',
  'Refactor notification preferences API',
  'Add E2E tests for checkout',
  'Fix CORS preflight on staging',
] as const

const labelPool = [
  'backend',
  'frontend',
  'security',
  'devops',
  'performance',
  'qa',
] as const

function labelDisplay(label: (typeof labelPool)[number]): string {
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function statusForIndex(
  index: number,
  total: number,
  completedRatio: number,
): IssueBoardStatus {
  const doneThrough = Math.floor(total * completedRatio)
  if (index < doneThrough) return 'done'
  if (index < doneThrough + Math.ceil((total - doneThrough) * 0.45)) {
    return 'in_progress'
  }
  return 'todo'
}

type SprintIssueSeed = {
  projectId: string
  projectKey: string
  sprintId: string
  count: number
  completedRatio: number
  keyStart: number
  blockedIndexes?: number[]
}

function buildSprintIssues(seed: SprintIssueSeed): ProjectIssue[] {
  const issues: ProjectIssue[] = []
  for (let i = 0; i < seed.count; i++) {
    const title = issueTitles[i % issueTitles.length]
    const labelKey = labelPool[i % labelPool.length]
    const status = statusForIndex(i, seed.count, seed.completedRatio)
    const assignee = assigneePool[i % assigneePool.length]
    const isBlocked = seed.blockedIndexes?.includes(i)
    issues.push({
      id: `${seed.sprintId}-i-${i}`,
      projectId: seed.projectId,
      sprintId: seed.sprintId,
      key: `${seed.projectKey}-${seed.keyStart + i}`,
      title: isBlocked ? `[Blocked] ${title}` : title,
      priority: i % 4 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
      status,
      label: labelDisplay(labelKey),
      labels: [labelKey],
      workflowStatus: isBlocked
        ? 'blocked'
        : status === 'done'
          ? 'done'
          : status === 'in_progress'
            ? i % 3 === 0
              ? 'testing'
              : i % 2 === 0
                ? 'in_progress'
                : 'review'
            : i % 5 === 0
              ? 'backlog'
              : 'todo',
      assignee,
      storyPoints: [1, 2, 3, 5, 8, 13][i % 6],
      done: status === 'done',
      progress: status === 'in_progress' ? 35 + (i % 4) * 15 : undefined,
    })
  }
  return issues
}

function buildBacklogIssues(
  projectId: string,
  projectKey: string,
  count: number,
  keyStart: number,
): ProjectIssue[] {
  const issues: ProjectIssue[] = []
  for (let i = 0; i < count; i++) {
    const labelKey = labelPool[(i + 2) % labelPool.length]
    issues.push({
      id: `${projectId}-backlog-${i}`,
      projectId,
      sprintId: null,
      key: `${projectKey}-${keyStart + i}`,
      title: issueTitles[(i + 5) % issueTitles.length],
      priority: 'medium',
      status: 'todo',
      label: labelDisplay(labelKey),
      labels: [labelKey],
      workflowStatus: 'backlog',
      assignee: assigneePool[i % assigneePool.length],
      storyPoints: 3,
    })
  }
  return issues
}

const sprintIssueSeeds: SprintIssueSeed[] = [
  { projectId: '1', projectKey: 'MOB', sprintId: 'sprint-42', count: 24, completedRatio: 0.67, keyStart: 101 },
  { projectId: '1', projectKey: 'MOB', sprintId: 'sprint-43', count: 11, completedRatio: 0, keyStart: 130 },
  { projectId: '1', projectKey: 'MOB', sprintId: 'sprint-41', count: 20, completedRatio: 0.9, keyStart: 80 },
  { projectId: '2', projectKey: 'MKT', sprintId: 'sprint-10', count: 8, completedRatio: 0.38, keyStart: 40 },
  { projectId: '2', projectKey: 'MKT', sprintId: 'sprint-7', count: 6, completedRatio: 0, keyStart: 55 },
  { projectId: '2', projectKey: 'MKT', sprintId: 'sprint-8', count: 12, completedRatio: 0.92, keyStart: 20 },
  {
    projectId: '3',
    projectKey: 'API',
    sprintId: 'sprint-16',
    count: 26,
    completedRatio: 0.42,
    keyStart: 220,
    blockedIndexes: [4, 11],
  },
  { projectId: '3', projectKey: 'API', sprintId: 'sprint-15', count: 18, completedRatio: 0, keyStart: 250 },
  { projectId: '3', projectKey: 'API', sprintId: 'sprint-14', count: 38, completedRatio: 0.92, keyStart: 180 },
  {
    projectId: '4',
    projectKey: 'ADM',
    sprintId: 'sprint-adm-3',
    count: 14,
    completedRatio: 0.43,
    keyStart: 30,
    blockedIndexes: [2],
  },
  { projectId: '4', projectKey: 'ADM', sprintId: 'sprint-adm-4', count: 9, completedRatio: 0, keyStart: 50 },
  { projectId: '4', projectKey: 'ADM', sprintId: 'sprint-adm-2', count: 16, completedRatio: 0.94, keyStart: 10 },
  {
    projectId: '5',
    projectKey: 'AIA',
    sprintId: 'sprint-aia-2',
    count: 22,
    completedRatio: 0.36,
    keyStart: 110,
    blockedIndexes: [7],
  },
  { projectId: '5', projectKey: 'AIA', sprintId: 'sprint-aia-3', count: 15, completedRatio: 0, keyStart: 140 },
  { projectId: '5', projectKey: 'AIA', sprintId: 'sprint-aia-1', count: 19, completedRatio: 0.89, keyStart: 90 },
]

export const demoIssues: ProjectIssue[] = [
  ...sprintIssueSeeds.flatMap(buildSprintIssues),
  ...buildBacklogIssues('1', 'MOB', 5, 200),
  ...buildBacklogIssues('2', 'MKT', 4, 70),
  ...buildBacklogIssues('3', 'API', 6, 300),
  ...buildBacklogIssues('4', 'ADM', 3, 65),
  ...buildBacklogIssues('5', 'AIA', 4, 160),
]

// ─── Activity & releases (for future API swap) ───────────────────────────────

export type DemoActivityItem = {
  id: string
  actor: string
  action: string
  target: string
  projectName: string
  timestamp: string
}

export const demoActivity: DemoActivityItem[] = [
  {
    id: 'a1',
    actor: 'Sarah',
    action: 'moved',
    target: 'MOB-118',
    projectName: 'Mobile App',
    timestamp: '2m ago',
  },
  {
    id: 'a2',
    actor: 'Jordan',
    action: 'commented on',
    target: 'API-224',
    projectName: 'API Service',
    timestamp: '18m ago',
  },
  {
    id: 'a3',
    actor: 'Luna',
    action: 'completed',
    target: 'MKT-28',
    projectName: 'Marketing Site',
    timestamp: '1h ago',
  },
  {
    id: 'a4',
    actor: 'System',
    action: 'deployed',
    target: 'v2.4.0-rc1',
    projectName: 'API Service',
    timestamp: '4h ago',
  },
]

export type DemoRelease = {
  id: string
  projectId: string
  version: string
  status: 'shipped' | 'scheduled' | 'in_progress'
  date: string
}

export const demoReleases: DemoRelease[] = [
  {
    id: 'r1',
    projectId: '1',
    version: 'Mobile 3.2.0',
    status: 'scheduled',
    date: 'Jun 18, 2026',
  },
  {
    id: 'r2',
    projectId: '3',
    version: 'API v2.4.0-rc1',
    status: 'in_progress',
    date: 'Jun 12, 2026',
  },
  {
    id: 'r3',
    projectId: '2',
    version: 'Marketing 1.8',
    status: 'shipped',
    date: 'Jun 3, 2026',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getDemoProjectById(projectId: string): Project | undefined {
  return demoProjects.find((p) => p.id === projectId)
}

export function countBlockedIssues(): number {
  return demoIssues.filter((i) => i.workflowStatus === 'blocked').length
}

export function getWorkspaceSprintStats(sprints: Sprint[]) {
  return {
    active: sprints.filter((s) => s.status === 'active').length,
    planned: sprints.filter((s) => s.status === 'planned').length,
    completed: sprints.filter((s) => s.status === 'completed').length,
    blockedIssues: countBlockedIssues(),
  }
}
