import type { CreateProjectFormValues } from '@/types/createProject'
import type { Project } from '@/types/projects'
import { generateProjectKey } from '@/utils/projectKey'

function resolveIcon(name: string): Project['icon'] {
  const lower = name.toLowerCase()
  if (lower.includes('api') || lower.includes('backend')) return 'api'
  if (lower.includes('web') || lower.includes('site')) {
    return 'web'
  }
  return 'mobile'
}

export function buildProjectFromForm(values: CreateProjectFormValues): Project {
  const trimmedName = values.name.trim()
  return {
    id: String(Date.now()),
    key: generateProjectKey(trimmedName) || 'PRJ',
    name: trimmedName,
    description: values.description.trim() || 'No description provided.',
    status: 'planning',
    methodology: values.methodology,
    boardType: values.methodology,
    icon: resolveIcon(values.name),
    issuesLabel: '0 Issues',
    openIssuesLabel: '0 Issues',
    progress: 0,
    recentActivity: 'Project created',
    members: [],
    isMember: true,
    isFavorite: false,
  }
}
