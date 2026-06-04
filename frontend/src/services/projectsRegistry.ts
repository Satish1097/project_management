import { mockProjects } from '@/services/mockProjects'
import type { Project } from '@/types/projects'

let projects: Project[] = [...mockProjects]

export function getProjects(): Project[] {
  return projects
}

export function getProjectByIdFromRegistry(
  projectId: string,
): Project | undefined {
  return projects.find((p) => p.id === projectId)
}

export function getProjectKeys(): string[] {
  return projects
    .map((p) => p.key)
    .filter((key): key is string => Boolean(key))
}

export function addProjectToRegistry(project: Project): void {
  projects = [...projects, project]
}

export function resetProjectsRegistry(): void {
  projects = [...mockProjects]
}
