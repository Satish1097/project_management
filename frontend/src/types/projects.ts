import type { ReactNode } from 'react'

export type ProjectStatus = 'active' | 'planning' | 'at_risk'

export type ProjectMember = {
  name: string
  color: string
  initials?: string
}

export type Project = {
  id: string
  name: string
  description: string
  status: ProjectStatus
  icon: 'mobile' | 'web' | 'api'
  issuesLabel: string
  issuesCritical?: boolean
  members: ProjectMember[]
  extraMembers?: number
}

export type ActivityItem = {
  id: string
  avatar: { type: 'initials' | 'user' | 'system'; value: string; color?: string }
  content: ReactNode
  timestamp: string
}
