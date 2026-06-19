import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  bulkAssignSprint as apiBulkAssignSprint,
  createIssue as apiCreateIssue,
  getBacklog as apiGetBacklog,
  listIssues as apiListIssues,
  updateIssue as apiUpdateIssue,
  type CreateIssuePayload,
  type UpdateIssuePayload,
} from '@/api/issues'
import { ApiError } from '@/api/types'
import { useSprints } from '@/contexts/SprintsContext'
import {
  addIssueToRegistry,
  assignIssueToSprint,
  getIssues,
  moveIssuesToSprint,
  setBacklogIssuesForProject,
  setSprintIssuesForProject,
  updateIssueInRegistry,
  upsertApiIssue,
} from '@/services/issuesRegistry'
import {
  mapIssueDetailToUi,
  mapIssueSummaryToUi,
} from '@/services/mapIssueApi'
import { syncProjectOpenIssueCount } from '@/services/projectStats'
import type { ProjectIssue } from '@/types/issues'

type IssuesContextValue = {
  issues: ProjectIssue[]
  backlogLoading: boolean
  backlogError: string | null
  sprintIssuesLoading: boolean
  sprintIssuesError: string | null
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
  loadSprintIssues: (projectId: string, sprintId: string) => Promise<void>
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
  const [sprintIssuesLoading, setSprintIssuesLoading] = useState(false)
  const [sprintIssuesError, setSprintIssuesError] = useState<string | null>(null)

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
    },
    [],
  )

  const loadSprintIssues = useCallback(async (projectId: string, sprintId: string) => {
    setSprintIssuesLoading(true)
    setSprintIssuesError(null)

    try {
      const summaries = await apiListIssues(projectId, { sprint: sprintId })
      const mapped = summaries.map((issue) => mapIssueSummaryToUi(issue, projectId))
      setSprintIssuesForProject(projectId, sprintId, mapped)
      setIssues(getIssues())
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Failed to load sprint issues.'
      setSprintIssuesError(message)
    } finally {
      setSprintIssuesLoading(false)
    }
  }, [])

  const createIssueViaApi = useCallback(
    async (projectId: string, payload: CreateIssuePayload): Promise<ProjectIssue> => {
      const created = await apiCreateIssue(projectId, payload)
      const issue = mapIssueDetailToUi(created, projectId)
      upsertApiIssue(issue)
      setIssues(getIssues())
      await loadBacklog(projectId)
      if (issue.sprintId) {
        await loadSprintIssues(projectId, issue.sprintId)
      }
      void syncProjectOpenIssueCount(projectId)
      return issue
    },
    [loadBacklog, loadSprintIssues],
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
      void syncProjectOpenIssueCount(projectId)
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
      await apiBulkAssignSprint(issueIds, sprintId)
      await loadBacklog(projectId)
      await loadSprintIssues(projectId, sprintId)
      await loadProjectSprints(projectId)
      setIssues(getIssues())
      void syncProjectOpenIssueCount(projectId)
    },
    [loadBacklog, loadSprintIssues, loadProjectSprints],
  )

  const moveManyToBacklogViaApi = useCallback(
    async (projectId: string, fromSprintId: string, issueIds: string[]) => {
      if (issueIds.length === 0) return
      await apiBulkAssignSprint(issueIds, null)
      await loadBacklog(projectId)
      await loadSprintIssues(projectId, fromSprintId)
      await loadProjectSprints(projectId)
      setIssues(getIssues())
      void syncProjectOpenIssueCount(projectId)
    },
    [loadBacklog, loadSprintIssues, loadProjectSprints],
  )

  const value = useMemo(
    () => ({
      issues,
      backlogLoading,
      backlogError,
      sprintIssuesLoading,
      sprintIssuesError,
      addIssue,
      updateIssue,
      assignToSprint,
      moveManyToSprint,
      moveManyToSprintViaApi,
      moveManyToBacklogViaApi,
      refresh,
      loadBacklog,
      loadSprintIssues,
      createIssueViaApi,
      updateIssueViaApi,
    }),
    [
      issues,
      backlogLoading,
      backlogError,
      sprintIssuesLoading,
      sprintIssuesError,
      addIssue,
      updateIssue,
      assignToSprint,
      moveManyToSprint,
      moveManyToSprintViaApi,
      moveManyToBacklogViaApi,
      refresh,
      loadBacklog,
      loadSprintIssues,
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
