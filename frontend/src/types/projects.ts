import type { ReactNode } from 'react'

export type ProjectStatus = 'active' | 'planning' | 'at_risk' | 'archived'

export type ProjectMember = {
  name: string
  color: string
  initials?: string
}

export type Project = {
  id: string
  /** Jira-style project key (e.g. MOB, API) */
  key?: string
  name: string
  description: string
  status: ProjectStatus
  icon: 'mobile' | 'web' | 'api'
  issuesLabel: string
  issuesCritical?: boolean
  members: ProjectMember[]
  extraMembers?: number
  /** Display label for open issues (e.g. "12 Open Issues") */
  openIssuesLabel?: string
  /** Non-completed issue count from the API */
  openIssueCount?: number
  progress?: number
  recentActivity?: string
  /** Shown in "My Projects" filter */
  isMember?: boolean
  /** Shown in "Favorites" filter */
  isFavorite?: boolean
}

export type ActivityItem = {
  id: string
  avatar: { type: 'initials' | 'user' | 'system'; value: string; color?: string }
  content: ReactNode
  timestamp: string
}
