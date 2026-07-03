import { useCallback } from 'react'
import {
  completeSprint as apiCompleteSprint,
  pauseSprint as apiPauseSprint,
  resumeSprint as apiResumeSprint,
  startSprint as apiStartSprint,
} from '@/api/sprints'
import { ApiError } from '@/api/types'
import { useIssues } from '@/contexts/IssuesContext'
import { useSprints } from '@/contexts/SprintsContext'
import { refreshKanbanBoard } from '@/features/kanban/kanbanRefreshBridge'

export function useSprintActions(projectId: string) {
  const { loadProjectSprints } = useSprints()
  const { loadBacklog } = useIssues()

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadProjectSprints(projectId),
      loadBacklog(projectId),
    ])
    refreshKanbanBoard()
  }, [loadProjectSprints, loadBacklog, projectId])

  const startSprint = useCallback(
    async (
      sprintId: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        await apiStartSprint(projectId, sprintId)
        await refreshAll()
        return { ok: true }
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to start sprint.'
        return { ok: false, message }
      }
    },
    [refreshAll],
  )

  const pauseSprint = useCallback(
    async (
      sprintId: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        await apiPauseSprint(projectId, sprintId)
        await refreshAll()
        return { ok: true }
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to pause sprint.'
        return { ok: false, message }
      }
    },
    [projectId, refreshAll],
  )

  const resumeSprint = useCallback(
    async (
      sprintId: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        await apiResumeSprint(projectId, sprintId)
        await refreshAll()
        return { ok: true }
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : 'Failed to resume sprint.'
        return { ok: false, message }
      }
    },
    [projectId, refreshAll],
  )

  const completeSprint = useCallback(
    async (
      sprintId: string,
      options: {
        destination: 'backlog' | 'sprint'
        targetSprintId?: string
      },
    ) => {
      try {
        await apiCompleteSprint(
          projectId,
          sprintId,
          options.destination === 'sprint' && options.targetSprintId
            ? { carry_forward_to_sprint_id: options.targetSprintId }
            : {},
        )
        await refreshAll()
      } catch (error) {
        throw error instanceof ApiError
          ? error
          : new ApiError('Failed to complete sprint.')
      }
    },
    [projectId, refreshAll],
  )

  const cancelSprint = useCallback(
    async (_sprintId: string) => {
      await refreshAll()
    },
    [refreshAll],
  )

  return {
    startSprint,
    pauseSprint,
    resumeSprint,
    completeSprint,
    cancelSprint,
    refreshAll,
  }
}
