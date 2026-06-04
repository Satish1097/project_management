import { useCallback } from 'react'
import { useIssues } from '@/contexts/IssuesContext'
import { useSprints } from '@/contexts/SprintsContext'
import { getSprintIssues } from '@/services/issuesRegistry'
import { getSprintsForProjectRegistry } from '@/services/sprintsRegistry'
import { computeDaysRemaining } from '@/utils/sprintDates'

export function useSprintActions(projectId: string) {
  const { updateSprint, refresh: refreshSprints } = useSprints()
  const { moveManyToSprint, refresh: refreshIssues } = useIssues()

  const refreshAll = useCallback(() => {
    refreshSprints()
    refreshIssues()
  }, [refreshSprints, refreshIssues])

  const startSprint = useCallback(
    (sprintId: string): { ok: true } | { ok: false; message: string } => {
      const sprint = getSprintsForProjectRegistry(projectId).find(
        (s) => s.id === sprintId,
      )
      if (!sprint) return { ok: false, message: 'Sprint not found' }
      if (!sprint.startDate || !sprint.endDate) {
        return { ok: false, message: 'Configure sprint dates before starting' }
      }
      const tickets = getSprintIssues(projectId, sprintId)
      if (tickets.length === 0) {
        return { ok: false, message: 'Add at least one ticket in planning' }
      }

      for (const s of getSprintsForProjectRegistry(projectId)) {
        if (s.status === 'active' && s.id !== sprintId) {
          updateSprint(s.id, { status: 'paused' })
        }
      }

      updateSprint(sprintId, {
        status: 'active',
        daysRemaining: computeDaysRemaining(sprint.endDate),
      })
      refreshAll()
      return { ok: true }
    },
    [projectId, updateSprint, refreshAll],
  )

  const pauseSprint = useCallback(
    (sprintId: string) => {
      updateSprint(sprintId, { status: 'paused', daysRemaining: undefined })
      refreshAll()
    },
    [updateSprint, refreshAll],
  )

  const completeSprint = useCallback(
    (
      sprintId: string,
      options: {
        destination: 'backlog' | 'sprint'
        targetSprintId?: string
      },
    ) => {
      const remaining = getSprintIssues(projectId, sprintId).filter(
        (i) => !i.done && i.status !== 'done',
      )
      const destId =
        options.destination === 'backlog' ? null : options.targetSprintId ?? null

      if (remaining.length > 0) {
        moveManyToSprint(
          remaining.map((i) => i.id),
          destId,
        )
      }

      updateSprint(sprintId, {
        status: 'completed',
        daysRemaining: undefined,
      })
      refreshAll()
    },
    [projectId, moveManyToSprint, updateSprint, refreshAll],
  )

  const cancelSprint = useCallback(
    (sprintId: string) => {
      updateSprint(sprintId, { status: 'cancelled', daysRemaining: undefined })
      refreshAll()
    },
    [updateSprint, refreshAll],
  )

  return { startSprint, pauseSprint, completeSprint, cancelSprint }
}
