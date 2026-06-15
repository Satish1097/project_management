import type { ProjectDetailApi, ProjectSummaryApi } from '@/api/projects'
import type { Project, ProjectStatus } from '@/types/projects'

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
    icon: resolveIcon(name),
    issuesLabel: `${issueCount} ${issueCount === 1 ? 'Issue' : 'Issues'}`,
    openIssuesLabel: `${issueCount} Open ${issueCount === 1 ? 'Issue' : 'Issues'}`,
    members: [],
    isMember: true,
  }
}

export function mapProjectDetailToUi(detail: ProjectDetailApi): Project {
  return mapProjectSummaryToUi(
    {
      id: detail.id,
      key: detail.key,
      slug: detail.slug,
      name: detail.name,
      status: detail.status,
      open_issue_count: 0,
      active_sprint_id: null,
    },
    detail.description,
  )
}
