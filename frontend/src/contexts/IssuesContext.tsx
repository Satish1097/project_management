import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useSprints } from '@/contexts/SprintsContext'
import {
  addIssueToRegistry,
  assignIssueToSprint,
  getIssues,
  moveIssuesToSprint,
  updateIssueInRegistry,
} from '@/services/issuesRegistry'
import type { ProjectIssue } from '@/types/issues'

type IssuesContextValue = {
  issues: ProjectIssue[]
  addIssue: (issue: ProjectIssue) => void
  updateIssue: (issueId: string, patch: Partial<ProjectIssue>) => void
  assignToSprint: (issueId: string, sprintId: string | null) => void
  moveManyToSprint: (issueIds: string[], sprintId: string | null) => void
  refresh: () => void
}

const IssuesContext = createContext<IssuesContextValue | null>(null)

export function IssuesProvider({ children }: { children: ReactNode }) {
  const { refresh: refreshSprints } = useSprints()
  const [issues, setIssues] = useState<ProjectIssue[]>(() => getIssues())

  const refresh = useCallback(() => {
    setIssues(getIssues())
    refreshSprints()
  }, [refreshSprints])

  const addIssue = useCallback(
    (issue: ProjectIssue) => {
      addIssueToRegistry(issue)
      refresh()
    },
    [refresh],
  )

  const updateIssue = useCallback(
    (issueId: string, patch: Partial<ProjectIssue>) => {
      updateIssueInRegistry(issueId, patch)
      refresh()
    },
    [refresh],
  )

  const assignToSprint = useCallback(
    (issueId: string, sprintId: string | null) => {
      assignIssueToSprint(issueId, sprintId)
      refresh()
    },
    [refresh],
  )

  const moveManyToSprint = useCallback(
    (issueIds: string[], sprintId: string | null) => {
      moveIssuesToSprint(issueIds, sprintId)
      refresh()
    },
    [refresh],
  )

  const value = useMemo(
    () => ({
      issues,
      addIssue,
      updateIssue,
      assignToSprint,
      moveManyToSprint,
      refresh,
    }),
    [issues, addIssue, updateIssue, assignToSprint, moveManyToSprint, refresh],
  )

  return (
    <IssuesContext.Provider value={value}>{children}</IssuesContext.Provider>
  )
}

export function useIssues(): IssuesContextValue {
  const context = useContext(IssuesContext)
  if (!context) {
    throw new Error('useIssues must be used within IssuesProvider')
  }
  return context
}
