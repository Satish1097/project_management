import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  createSprint as apiCreateSprint,
  getProjectSprints as apiGetProjectSprints,
  getSprint as apiGetSprint,
  updateSprint as apiUpdateSprint,
  type CreateSprintPayload,
  type UpdateSprintPayload,
} from '@/api/sprints'
import { ApiError } from '@/api/types'
import {
  mapSprintDetailToUi,
  mapSprintSummaryToUi,
} from '@/services/mapSprintApi'
import {
  getSprints,
  replaceSprintsForProject,
  updateSprintInRegistry,
  upsertSprintInRegistry,
} from '@/services/sprintsRegistry'
import type { Sprint } from '@/types/sprints'

const RECENTLY_CREATED_HIGHLIGHT_MS = 3000

type SprintsContextValue = {
  sprints: Sprint[]
  loading: boolean
  error: string | null
  recentlyCreatedSprintId: string | null
  loadProjectSprints: (projectId: string) => Promise<void>
  loadSprintDetail: (sprintId: string, projectId: string) => Promise<Sprint>
  createSprintViaApi: (
    projectId: string,
    payload: CreateSprintPayload,
  ) => Promise<Sprint>
  updateSprintViaApi: (
    sprintId: string,
    projectId: string,
    payload: UpdateSprintPayload,
  ) => Promise<Sprint>
  refresh: () => void
}

const SprintsContext = createContext<SprintsContextValue | null>(null)

export function SprintsProvider({ children }: { children: ReactNode }) {
  const [sprints, setSprints] = useState<Sprint[]>(() => getSprints())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentlyCreatedSprintId, setRecentlyCreatedSprintId] = useState<
    string | null
  >(null)
  const fetchIdRef = useRef(0)
  const highlightTimerRef = useRef<number | null>(null)

  const refresh = useCallback(() => {
    setSprints(getSprints())
  }, [])

  const loadProjectSprints = useCallback(async (projectId: string) => {
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)

    try {
      const summaries = await apiGetProjectSprints(projectId)
      if (fetchId !== fetchIdRef.current) return

      const mapped = summaries.map((sprint) => mapSprintSummaryToUi(sprint, projectId))
      replaceSprintsForProject(projectId, mapped)
      setSprints(getSprints())
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return
      const message =
        err instanceof ApiError ? err.message : 'Failed to load sprints.'
      setError(message)
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const loadSprintDetail = useCallback(
    async (sprintId: string, projectId: string): Promise<Sprint> => {
      const detail = await apiGetSprint(projectId, sprintId)
      const sprint = mapSprintDetailToUi(detail, projectId)
      upsertSprintInRegistry(sprint)
      setSprints(getSprints())
      return sprint
    },
    [],
  )

  const markRecentlyCreated = useCallback((sprintId: string) => {
    if (highlightTimerRef.current !== null) {
      window.clearTimeout(highlightTimerRef.current)
    }
    setRecentlyCreatedSprintId(sprintId)
    highlightTimerRef.current = window.setTimeout(() => {
      setRecentlyCreatedSprintId(null)
      highlightTimerRef.current = null
    }, RECENTLY_CREATED_HIGHLIGHT_MS)
  }, [])

  const createSprintViaApi = useCallback(
    async (projectId: string, payload: CreateSprintPayload): Promise<Sprint> => {
      const created = await apiCreateSprint(projectId, payload)
      const sprint = mapSprintDetailToUi(created, projectId)
      upsertSprintInRegistry(sprint)
      setSprints(getSprints())
      markRecentlyCreated(sprint.id)
      return sprint
    },
    [markRecentlyCreated],
  )

  const updateSprintViaApi = useCallback(
    async (
      sprintId: string,
      projectId: string,
      payload: UpdateSprintPayload,
    ): Promise<Sprint> => {
      const updated = await apiUpdateSprint(projectId, sprintId, payload)
      const sprint = mapSprintDetailToUi(updated, projectId)
      updateSprintInRegistry(sprintId, sprint)
      setSprints(getSprints())
      return sprint
    },
    [],
  )

  const value = useMemo(
    () => ({
      sprints,
      loading,
      error,
      recentlyCreatedSprintId,
      loadProjectSprints,
      loadSprintDetail,
      createSprintViaApi,
      updateSprintViaApi,
      refresh,
    }),
    [
      sprints,
      loading,
      error,
      recentlyCreatedSprintId,
      loadProjectSprints,
      loadSprintDetail,
      createSprintViaApi,
      updateSprintViaApi,
      refresh,
    ],
  )

  return (
    <SprintsContext.Provider value={value}>{children}</SprintsContext.Provider>
  )
}

export function useSprints(): SprintsContextValue {
  const context = useContext(SprintsContext)
  if (!context) {
    throw new Error('useSprints must be used within SprintsProvider')
  }
  return context
}
