import type { ProjectDetailApi, ProjectSummaryApi } from '@/api/projects'
import type { BoardType, Project, ProjectMethodology, ProjectStatus } from '@/types/projects'

function mapStatus(status: string): ProjectStatus {
  if (status === 'archived') return 'archived'
  if (status === 'active') return 'active'
  return 'planning'
}

function resolveIcon(name: string): Project['icon'] {
  const lower = (name ?? '').toLowerCase()
  if (lower.includes('api') || lower.includes('backend')) return 'api'
  if (lower.includes('web') || lower.includes('site')) return 'web'
  return 'mobile'
}

export function buildIssueCountLabels(issueCount: number) {
  return {
    issuesLabel: `${issueCount} ${issueCount === 1 ? 'Issue' : 'Issues'}`,
    openIssuesLabel: `${issueCount} Open ${issueCount === 1 ? 'Issue' : 'Issues'}`,
    openIssueCount: issueCount,
  }
}

function mapMethodology(value: string): ProjectMethodology {
  return value === 'kanban' ? 'kanban' : 'scrum'
}

function mapBoardType(value: string): BoardType {
  return value === 'kanban' ? 'kanban' : 'scrum'
}

export function mapProjectSummaryToUi(
  summary: ProjectSummaryApi,
  description = '',
): Project {
  const issueCount = summary.open_issue_count ?? 0
  const name = summary.name?.trim() || 'Untitled project'
  return {
    id: summary.id,
    key: summary.key ?? '',
    name,
    description: description || 'No description provided.',
    status: mapStatus(summary.status ?? 'active'),
    methodology: mapMethodology(summary.methodology ?? 'scrum'),
    boardType: mapBoardType(summary.board_type ?? 'scrum'),
    icon: resolveIcon(name),
    ...buildIssueCountLabels(issueCount),
    members: [],
    isMember: true,
    recentActivity: summary.recent_activity,
  }
}

export function mapProjectDetailToUi(
  detail: ProjectDetailApi,
  openIssueCount?: number,
): Project {
  const issueCount = openIssueCount ?? 0
  const mapped = mapProjectSummaryToUi(
    {
      id: detail.id,
      key: detail.key,
      slug: detail.slug,
      name: detail.name,
      status: detail.status,
      methodology: detail.methodology,
      board_type: detail.board_type,
      open_issue_count: issueCount,
      active_sprint_id: null,
    },
    detail.description,
  )
  return {
    ...mapped,
    defaultSprintWeeks: detail.default_sprint_weeks,
  }
}
