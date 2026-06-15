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
import {
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  getProjects as apiGetProjects,
  type CreateProjectPayload,
  type UpdateProjectPayload,
} from '@/api/projects'
import { useAppContext } from '@/features/context/useAppContext'
import {
  getProjectKeys,
  setProjectsInRegistry,
  upsertProjectInRegistry,
} from '@/services/projectsRegistry'
import { mapProjectDetailToUi, mapProjectSummaryToUi } from '@/services/mapProjectApi'
import type { Project } from '@/types/projects'

type ProjectsContextValue = {
  projects: Project[]
  projectKeys: string[]
  isLoading: boolean
  error: string | null
  refreshProjects: () => Promise<void>
  createProject: (payload: CreateProjectPayload) => Promise<Project>
  updateProject: (projectId: string, payload: UpdateProjectPayload) => Promise<Project>
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const {
    currentOrganization,
    currentProject,
    setCurrentProject,
    refreshContext,
  } = useAppContext()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const refreshProjects = useCallback(async () => {
    if (!currentOrganization) {
      setProjects([])
      setProjectsInRegistry([])
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const summaries = await apiGetProjects(currentOrganization.id)
      if (fetchId !== fetchIdRef.current) return

      const mapped = (Array.isArray(summaries) ? summaries : []).map((summary) =>
        mapProjectSummaryToUi(summary),
      )
      console.log('PROJECT_API_RESPONSE', summaries)
      console.log('PROJECT_CONTEXT_STATE', mapped)
      setProjects(mapped)
      setProjectsInRegistry(mapped)
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      const message = err instanceof Error ? err.message : 'Failed to load projects.'
      setError(message)
      setProjects([])
      setProjectsInRegistry([])
    } finally {
      if (fetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [currentOrganization])

  useEffect(() => {
    void refreshProjects()
  }, [refreshProjects])

  useEffect(() => {
    if (isLoading || !currentOrganization || projects.length === 0) return

    const selectedValid =
      currentProject && projects.some((project) => project.id === currentProject.id)

    if (!selectedValid) {
      setCurrentProject(projects[0].id)
    }
  }, [isLoading, currentOrganization, currentProject, projects, setCurrentProject])

  const projectKeys = useMemo(
    () => projects.map((p) => p.key).filter((key): key is string => Boolean(key)),
    [projects],
  )

  const createProject = useCallback(
    async (payload: CreateProjectPayload): Promise<Project> => {
      if (!currentOrganization) {
        throw new Error('No organization selected.')
      }

      const created = await apiCreateProject(currentOrganization.id, payload)
      const project = mapProjectDetailToUi(created)

      await refreshContext()
      setCurrentProject(project.id)
      upsertProjectInRegistry(project)
      setProjects((prev) => {
        const exists = prev.some((item) => item.id === project.id)
        return exists
          ? prev.map((item) => (item.id === project.id ? project : item))
          : [...prev, project]
      })

      return project
    },
    [currentOrganization, refreshContext, setCurrentProject],
  )

  const updateProject = useCallback(
    async (projectId: string, payload: UpdateProjectPayload): Promise<Project> => {
      const updated = await apiUpdateProject(projectId, payload)
      const project = mapProjectDetailToUi(updated)

      upsertProjectInRegistry(project)
      setProjects((prev) =>
        prev.map((item) => (item.id === project.id ? project : item)),
      )
      await refreshContext()

      return project
    },
    [refreshContext],
  )

  const value = useMemo(
    () => ({
      projects,
      projectKeys,
      isLoading,
      error,
      refreshProjects,
      createProject,
      updateProject,
    }),
    [
      projects,
      projectKeys,
      isLoading,
      error,
      refreshProjects,
      createProject,
      updateProject,
    ],
  )

  return (
    <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>
  )
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext)
  if (!context) {
    throw new Error('useProjects must be used within ProjectsProvider')
  }
  return context
}

export function useProjectKeys(): string[] {
  const { projectKeys } = useProjects()
  return projectKeys.length > 0 ? projectKeys : getProjectKeys()
}
