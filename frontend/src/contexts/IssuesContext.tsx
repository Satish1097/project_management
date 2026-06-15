import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createIssue as apiCreateIssue,
  getBacklog as apiGetBacklog,
  updateIssue as apiUpdateIssue,
  type CreateIssuePayload,
  type UpdateIssuePayload,
} from '@/api/issues'
import {
  moveIssuesToBacklog as apiMoveIssuesToBacklog,
  moveIssuesToSprint as apiMoveIssuesToSprint,
} from '@/api/sprints'
import { ApiError } from '@/api/types'
import { useSprints } from '@/contexts/SprintsContext'
import {
  addIssueToRegistry,
  assignIssueToSprint,
  getIssues,
  moveIssuesToSprint,
  setBacklogIssuesForProject,
  updateIssueInRegistry,
  upsertApiIssue,
} from '@/services/issuesRegistry'
import {
  mapIssueDetailToUi,
  mapIssueSummaryToUi,
} from '@/services/mapIssueApi'
import type { ProjectIssue } from '@/types/issues'

type IssuesContextValue = {
  issues: ProjectIssue[]
  backlogLoading: boolean
  backlogError: string | null
  addIssue: (issue: ProjectIssue) => void
  updateIssue: (issueId: string, patch: Partial<ProjectIssue>) => void
  assignToSprint: (issueId: string, sprintId: string | null) => void
  moveManyToSprint: (issueIds: string[], sprintId: string | null) => void
  moveManyToSprintViaApi: (
    projectId: string,
    sprintId: string,
    issueIds: string[],
  ) => Promise<void>
  moveManyToBacklogViaApi: (
    projectId: string,
    fromSprintId: string,
    issueIds: string[],
  ) => Promise<void>
  refresh: () => void
  loadBacklog: (projectId: string) => Promise<void>
  createIssueViaApi: (
    projectId: string,
    payload: CreateIssuePayload,
  ) => Promise<ProjectIssue>
  updateIssueViaApi: (
    issueId: string,
    projectId: string,
    payload: UpdateIssuePayload,
  ) => Promise<ProjectIssue>
}

const IssuesContext = createContext<IssuesContextValue | null>(null)

export function IssuesProvider({ children }: { children: ReactNode }) {
  const { refresh: refreshSprints, loadProjectSprints } = useSprints()
  const [issues, setIssues] = useState<ProjectIssue[]>(() => getIssues())
  const [backlogLoading, setBacklogLoading] = useState(false)
  const [backlogError, setBacklogError] = useState<string | null>(null)

  const syncFromRegistry = useCallback(() => {
    setIssues(getIssues())
    refreshSprints()
  }, [refreshSprints])

  const refresh = useCallback(() => {
    syncFromRegistry()
  }, [syncFromRegistry])

  const loadBacklog = useCallback(async (projectId: string) => {
    setBacklogLoading(true)
    setBacklogError(null)

    try {
      const summaries = await apiGetBacklog(projectId)
      const mapped = summaries.map((issue) => mapIssueSummaryToUi(issue, projectId))
      setBacklogIssuesForProject(projectId, mapped)
      setIssues(getIssues())
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load backlog.'
      setBacklogError(message)
    } finally {
      setBacklogLoading(false)
    }
  }, [])

  const createIssueViaApi = useCallback(
    async (projectId: string, payload: CreateIssuePayload): Promise<ProjectIssue> => {
      const created = await apiCreateIssue(projectId, payload)
      const issue = mapIssueDetailToUi(created, projectId)
      upsertApiIssue(issue)
      setIssues(getIssues())
      await loadBacklog(projectId)
      return issue
    },
    [loadBacklog],
  )

  const updateIssueViaApi = useCallback(
    async (
      issueId: string,
      projectId: string,
      payload: UpdateIssuePayload,
    ): Promise<ProjectIssue> => {
      const updated = await apiUpdateIssue(issueId, payload)
      const issue = mapIssueDetailToUi(updated, projectId)
      upsertApiIssue(issue)
      setIssues(getIssues())
      return issue
    },
    [],
  )

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

  const moveManyToSprintViaApi = useCallback(
    async (projectId: string, sprintId: string, issueIds: string[]) => {
      if (issueIds.length === 0) return
      await apiMoveIssuesToSprint(sprintId, issueIds)
      await loadBacklog(projectId)
      await loadProjectSprints(projectId)
      setIssues(getIssues())
    },
    [loadBacklog, loadProjectSprints],
  )

  const moveManyToBacklogViaApi = useCallback(
    async (projectId: string, fromSprintId: string, issueIds: string[]) => {
      if (issueIds.length === 0) return
      await apiMoveIssuesToBacklog(fromSprintId, issueIds)
      await loadBacklog(projectId)
      await loadProjectSprints(projectId)
      setIssues(getIssues())
    },
    [loadBacklog, loadProjectSprints],
  )

  const value = useMemo(
    () => ({
      issues,
      backlogLoading,
      backlogError,
      addIssue,
      updateIssue,
      assignToSprint,
      moveManyToSprint,
      moveManyToSprintViaApi,
      moveManyToBacklogViaApi,
      refresh,
      loadBacklog,
      createIssueViaApi,
      updateIssueViaApi,
    }),
    [
      issues,
      backlogLoading,
      backlogError,
      addIssue,
      updateIssue,
      assignToSprint,
      moveManyToSprint,
      moveManyToSprintViaApi,
      moveManyToBacklogViaApi,
      refresh,
      loadBacklog,
      createIssueViaApi,
      updateIssueViaApi,
    ],
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
