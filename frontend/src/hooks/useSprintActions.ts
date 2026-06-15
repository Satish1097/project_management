import { useCallback } from 'react'
import {
  completeSprint as apiCompleteSprint,
  startSprint as apiStartSprint,
} from '@/api/sprints'
import { ApiError } from '@/api/types'
import { useIssues } from '@/contexts/IssuesContext'
import { useSprints } from '@/contexts/SprintsContext'

export function useSprintActions(projectId: string) {
  const { loadProjectSprints } = useSprints()
  const { loadBacklog } = useIssues()

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadProjectSprints(projectId),
      loadBacklog(projectId),
    ])
  }, [loadProjectSprints, loadBacklog, projectId])

  const startSprint = useCallback(
    async (
      sprintId: string,
    ): Promise<{ ok: true } | { ok: false; message: string }> => {
      try {
        await apiStartSprint(sprintId)
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
    async (_sprintId: string) => {
      await refreshAll()
    },
    [refreshAll],
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
    [refreshAll],
  )

  const cancelSprint = useCallback(
    async (_sprintId: string) => {
      await refreshAll()
    },
    [refreshAll],
  )

  return { startSprint, pauseSprint, completeSprint, cancelSprint, refreshAll }
}
