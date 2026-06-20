import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type { ProjectMemberRecord } from '@/api/members'
import { useProjectMembersData } from '@/hooks/useProjectMembersData'
import { reloadProjectMembers } from '@/services/projectMembersStore'

type ProjectMembersContextValue = {
  members: ProjectMemberRecord[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

const ProjectMembersContext = createContext<ProjectMembersContextValue | null>(null)

export function ProjectMembersProvider({
  projectId,
  children,
}: {
  projectId: string
  children: ReactNode
}) {
  const { members, loading, error } = useProjectMembersData(projectId)

  const reload = useCallback(async () => {
    await reloadProjectMembers(projectId)
  }, [projectId])

  const value = useMemo(
    () => ({ members, loading, error, reload }),
    [members, loading, error, reload],
  )

  return (
    <ProjectMembersContext.Provider value={value}>
      {children}
    </ProjectMembersContext.Provider>
  )
}

export function useProjectMembersContext(): ProjectMembersContextValue {
  const context = useContext(ProjectMembersContext)
  if (!context) {
    throw new Error('useProjectMembersContext must be used within ProjectMembersProvider')
  }
  return context
}
