import type { Project } from '@/types/projects'

let projects: Project[] = []

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

export function setProjectsInRegistry(nextProjects: Project[]): void {
  projects = [...nextProjects]
}

export function upsertProjectInRegistry(project: Project): void {
  const index = projects.findIndex((p) => p.id === project.id)
  if (index === -1) {
    projects = [...projects, project]
    return
  }
  projects = projects.map((p) => (p.id === project.id ? project : p))
}

export function resetProjectsRegistry(): void {
  projects = []
}
