import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getProjectMembers } from '@/api/members'
import type { ProjectMemberRecord } from '@/api/members'
import { ApiError } from '@/api/types'

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
  const [members, setMembers] = useState<ProjectMemberRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!projectId) {
      setMembers([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await getProjectMembers(projectId)
      setMembers(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load members.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void reload()
  }, [reload])

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
