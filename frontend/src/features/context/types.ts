import type { AuthUser } from '@/features/auth/types'

export type ContextOrganization = {
  id: string
  name: string
  slug: string
  role: string
  is_active: boolean
  project_count: number
  member_count: number
}

export type ContextProject = {
  id: string
  key: string
  slug: string
  name: string
  status: string
  open_issue_count: number
  active_sprint_id: string | null
}

export type MeContextData = {
  user: AuthUser
  organizations: ContextOrganization[]
  projects: ContextProject[]
}

export type AppContextValue = {
  user: AuthUser | null
  organizations: ContextOrganization[]
  projects: ContextProject[]
  projectsForCurrentOrg: ContextProject[]
  currentOrganization: ContextOrganization | null
  currentProject: ContextProject | null
  isLoading: boolean
  contextError: string | null
  refreshContext: () => Promise<void>
  setCurrentOrganization: (organizationId: string) => void
  setCurrentProject: (projectId: string) => void
}
