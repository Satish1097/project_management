import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getMeContext } from '@/api/context'
import { ApiError } from '@/api/types'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  clearContextSelection,
  getStoredOrganizationId,
  getStoredProjectId,
  setStoredOrganizationId,
  setStoredProjectId,
} from './contextStorage'
import { getProjectsForOrganization } from './groupProjectsByOrganization'
import type {
  AppContextValue,
  ContextOrganization,
  ContextProject,
  MeContextData,
} from './types'
import type { AuthUser } from '@/features/auth/types'

const AppContext = createContext<AppContextValue | null>(null)

type AppContextProviderProps = {
  children: ReactNode
}

function resolveOrganizationSelection(
  organizations: ContextOrganization[],
  preferredId: string | null,
): ContextOrganization | null {
  if (organizations.length === 0) return null

  if (preferredId) {
    const stored = organizations.find((org) => org.id === preferredId)
    if (stored) return stored
  }

  if (organizations.length === 1) return organizations[0]
  return null
}

function resolveProjectSelection(
  projects: ContextProject[],
  preferredId: string | null,
): ContextProject | null {
  if (projects.length === 0) return null

  if (preferredId) {
    const stored = projects.find((project) => project.id === preferredId)
    if (stored) return stored
  }

  if (projects.length === 1) return projects[0]
  return null
}

function applySelection(
  data: MeContextData,
  preferredOrgId: string | null,
  preferredProjectId: string | null,
): {
  currentOrganization: ContextOrganization | null
  currentProject: ContextProject | null
} {
  const currentOrganization = resolveOrganizationSelection(
    data.organizations,
    preferredOrgId,
  )
  const orgProjects = currentOrganization
    ? getProjectsForOrganization(
        currentOrganization.id,
        data.organizations,
        data.projects,
      )
    : []
  const currentProject = resolveProjectSelection(orgProjects, preferredProjectId)

  if (currentOrganization) {
    setStoredOrganizationId(currentOrganization.id)
  }
  if (currentProject) {
    setStoredProjectId(currentProject.id)
  }

  return { currentOrganization, currentProject }
}

export function AppContextProvider({ children }: AppContextProviderProps) {
  const { isAuthenticated } = useAuth()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [organizations, setOrganizations] = useState<ContextOrganization[]>([])
  const [projects, setProjects] = useState<ContextProject[]>([])
  const [currentOrganization, setCurrentOrganizationState] =
    useState<ContextOrganization | null>(null)
  const [currentProject, setCurrentProjectState] = useState<ContextProject | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [contextError, setContextError] = useState<string | null>(null)
  const loadIdRef = useRef(0)

  const clearContext = useCallback(() => {
    clearContextSelection()
    setUser(null)
    setOrganizations([])
    setProjects([])
    setCurrentOrganizationState(null)
    setCurrentProjectState(null)
    setContextError(null)
    setIsLoading(false)
  }, [])

  const refreshContext = useCallback(async () => {
    const loadId = ++loadIdRef.current
    setIsLoading(true)
    setContextError(null)

    try {
      const data = await getMeContext()
      if (loadId !== loadIdRef.current) return

      console.log('ME_CONTEXT', data)
      console.log('CONTEXT_PROJECTS', data.projects)

      setUser(data.user)
      setOrganizations(data.organizations)
      setProjects(data.projects)

      const selection = applySelection(
        data,
        getStoredOrganizationId(),
        getStoredProjectId(),
      )
      setCurrentOrganizationState(selection.currentOrganization)
      setCurrentProjectState(selection.currentProject)
    } catch (error) {
      if (loadId !== loadIdRef.current) return

      const message =
        error instanceof ApiError ? error.message : 'Failed to load workspace context.'
      setContextError(message)
      setUser(null)
      setOrganizations([])
      setProjects([])
      setCurrentOrganizationState(null)
      setCurrentProjectState(null)
    } finally {
      if (loadId === loadIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      loadIdRef.current += 1
      clearContext()
      return
    }

    void refreshContext()
  }, [isAuthenticated, clearContext, refreshContext])

  const setCurrentOrganization = useCallback(
    (organizationId: string) => {
      const organization = organizations.find((org) => org.id === organizationId)
      if (!organization) return

      setCurrentOrganizationState(organization)
      setStoredOrganizationId(organization.id)

      const orgProjects = getProjectsForOrganization(
        organization.id,
        organizations,
        projects,
      )
      const nextProject = resolveProjectSelection(orgProjects, getStoredProjectId())
      setCurrentProjectState(nextProject)
      if (nextProject) {
        setStoredProjectId(nextProject.id)
      }
    },
    [organizations, projects],
  )

  const setCurrentProject = useCallback(
    (projectId: string) => {
      if (!currentOrganization) return

      const orgProjects = getProjectsForOrganization(
        currentOrganization.id,
        organizations,
        projects,
      )
      const project = orgProjects.find((item) => item.id === projectId)
      if (project) {
        setCurrentProjectState(project)
        setStoredProjectId(project.id)
        return
      }

      // Bootstrap /me/context may be stale; still persist selection by id.
      setCurrentProjectState({
        id: projectId,
        key: '',
        slug: '',
        name: '',
        status: 'active',
        open_issue_count: 0,
        active_sprint_id: null,
      })
      setStoredProjectId(projectId)
    },
    [currentOrganization, organizations, projects],
  )

  const projectsForCurrentOrg = useMemo(() => {
    if (!currentOrganization) return []
    return getProjectsForOrganization(
      currentOrganization.id,
      organizations,
      projects,
    )
  }, [currentOrganization, organizations, projects])

  const value = useMemo(
    () => ({
      user,
      organizations,
      projects,
      projectsForCurrentOrg,
      currentOrganization,
      currentProject,
      isLoading,
      contextError,
      refreshContext,
      setCurrentOrganization,
      setCurrentProject,
    }),
    [
      user,
      organizations,
      projects,
      projectsForCurrentOrg,
      currentOrganization,
      currentProject,
      isLoading,
      contextError,
      refreshContext,
      setCurrentOrganization,
      setCurrentProject,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider')
  }
  return context
}
