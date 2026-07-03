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
  deleteIssue as apiDeleteIssue,
  getBacklog as apiGetBacklog,
  listIssues as apiListIssues,
  transitionIssue as apiTransitionIssue,
  updateIssue as apiUpdateIssue,
  type CreateIssuePayload,
  type UpdateIssuePayload,
} from '@/api/issues'
import { ApiError } from '@/api/types'
import { useSprints } from '@/contexts/SprintsContext'
import {
  addIssueToRegistry,
  assignIssueToSprint,
  getIssueById,
  getIssues,
  moveIssuesToSprint,
  removeIssueFromRegistry,
  setBacklogIssuesForProject,
  setSprintIssuesForProject,
  updateIssueInRegistry,
  upsertApiIssue,
} from '@/services/issuesRegistry'
import {
  mapIssueDetailToUi,
  mapIssueSummaryToUi,
} from '@/services/mapIssueApi'
import { refreshKanbanBoard } from '@/features/kanban/kanbanRefreshBridge'
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
    options?: { light?: boolean },
  ) => Promise<ProjectIssue>
  updateIssueViaApi: (
    issueId: string,
    projectId: string,
    payload: UpdateIssuePayload,
  ) => Promise<ProjectIssue>
  deleteIssueViaApi: (
    issueId: string,
    projectId: string,
    sprintId: string | null,
  ) => Promise<void>
  transitionIssueViaApi: (
    issueId: string,
    projectId: string,
    toStatusId: string,
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

  const reloadProjectIssuesAndRefreshBoard = useCallback(
    async (projectId: string, ...sprintIds: (string | null | undefined)[]) => {
      await loadBacklog(projectId)
      const uniqueSprintIds = [
        ...new Set(sprintIds.filter((id): id is string => Boolean(id))),
      ]
      for (const sprintId of uniqueSprintIds) {
        await loadSprintIssues(projectId, sprintId)
      }
      refreshKanbanBoard()
    },
    [loadBacklog, loadSprintIssues],
  )

  const createIssueViaApi = useCallback(
    async (
      projectId: string,
      payload: CreateIssuePayload,
      options?: { light?: boolean },
    ): Promise<ProjectIssue> => {
      const created = await apiCreateIssue(projectId, payload)
      const issue = mapIssueDetailToUi(created, projectId)
      upsertApiIssue(issue)
      setIssues(getIssues())
      if (options?.light) {
        refreshKanbanBoard()
        void syncProjectOpenIssueCount(projectId)
        return issue
      }
      await reloadProjectIssuesAndRefreshBoard(projectId, issue.sprintId)
      void syncProjectOpenIssueCount(projectId)
      return issue
    },
    [reloadProjectIssuesAndRefreshBoard],
  )

  const updateIssueViaApi = useCallback(
    async (
      issueId: string,
      projectId: string,
      payload: UpdateIssuePayload,
    ): Promise<ProjectIssue> => {
      const previousSprintId = getIssueById(issueId)?.sprintId
      const updated = await apiUpdateIssue(issueId, payload)
      const issue = mapIssueDetailToUi(updated, projectId)
      upsertApiIssue(issue)
      setIssues(getIssues())
      await reloadProjectIssuesAndRefreshBoard(
        projectId,
        previousSprintId,
        issue.sprintId,
      )
      void syncProjectOpenIssueCount(projectId)
      return issue
    },
    [reloadProjectIssuesAndRefreshBoard],
  )

  const deleteIssueViaApi = useCallback(
    async (
      issueId: string,
      projectId: string,
      sprintId: string | null,
    ): Promise<void> => {
      await apiDeleteIssue(issueId)
      removeIssueFromRegistry(issueId)
      setIssues(getIssues())
      await reloadProjectIssuesAndRefreshBoard(projectId, sprintId)
      void syncProjectOpenIssueCount(projectId)
    },
    [reloadProjectIssuesAndRefreshBoard],
  )

  const transitionIssueViaApi = useCallback(
    async (
      issueId: string,
      projectId: string,
      toStatusId: string,
    ): Promise<ProjectIssue> => {
      const previousSprintId = getIssueById(issueId)?.sprintId
      const updated = await apiTransitionIssue(issueId, toStatusId)
      const issue = mapIssueDetailToUi(updated, projectId)
      upsertApiIssue(issue)
      setIssues(getIssues())
      await reloadProjectIssuesAndRefreshBoard(
        projectId,
        previousSprintId,
        issue.sprintId,
      )
      void syncProjectOpenIssueCount(projectId)
      return issue
    },
    [reloadProjectIssuesAndRefreshBoard],
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
      refreshKanbanBoard()
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
      refreshKanbanBoard()
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
      deleteIssueViaApi,
      transitionIssueViaApi,
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
      deleteIssueViaApi,
      transitionIssueViaApi,
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
