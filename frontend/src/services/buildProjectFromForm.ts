import { CURRENT_USER } from '@/constants/currentUser'
import { mockMembers } from '@/services/mockMembers'
import type { CreateProjectFormValues } from '@/types/createProject'
import type { Project, ProjectMember } from '@/types/projects'

function mapMember(userId: string): ProjectMember | undefined {
  const user = mockMembers.find((m) => m.id === userId)
  if (!user) return undefined
  return { name: user.name.split(' ')[0] ?? user.name, color: user.color }
}

function resolveIcon(
  projectType: CreateProjectFormValues['projectType'],
  name: string,
): Project['icon'] {
  const lower = name.toLowerCase()
  if (lower.includes('api') || lower.includes('backend')) return 'api'
  if (
    projectType === 'marketing' ||
    lower.includes('web') ||
    lower.includes('site')
  ) {
    return 'web'
  }
  return 'mobile'
}

export function buildProjectFromForm(values: CreateProjectFormValues): Project {
  const leadId = values.leadId || CURRENT_USER.id
  const memberIds = new Set([leadId, ...values.memberIds])

  const members: ProjectMember[] = []
  for (const id of memberIds) {
    const member = mapMember(id)
    if (member) members.push(member)
  }

  const extraMembers =
    members.length > 3 ? members.length - 3 : undefined
  const displayMembers = members.slice(0, 3)

  return {
    id: String(Date.now()),
    key: values.key,
    name: values.name.trim(),
    description: values.description.trim() || 'No description provided.',
    status: 'planning',
    icon: resolveIcon(values.projectType, values.name),
    issuesLabel: '0 Issues',
    openIssuesLabel: '0 Issues',
    progress: 0,
    recentActivity: 'Project created',
    members: displayMembers,
    extraMembers,
    isMember: true,
    isFavorite: false,
  }
}
