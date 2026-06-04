import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  addProjectToRegistry,
  getProjectKeys,
  getProjects,
} from '@/services/projectsRegistry'
import type { Project } from '@/types/projects'

type ProjectsContextValue = {
  projects: Project[]
  projectKeys: string[]
  addProject: (project: Project) => void
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null)

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => getProjects())

  const projectKeys = useMemo(
    () => projects.map((p) => p.key).filter((key): key is string => Boolean(key)),
    [projects],
  )

  const addProject = useCallback((project: Project) => {
    addProjectToRegistry(project)
    setProjects(getProjects())
  }, [])

  const value = useMemo(
    () => ({
      projects,
      projectKeys,
      addProject,
    }),
    [projects, projectKeys, addProject],
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
