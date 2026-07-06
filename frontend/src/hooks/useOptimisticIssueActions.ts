import { useCallback, useState } from 'react'
import {
  bulkAssignSprint,
  deleteIssue as apiDeleteIssue,
  updateIssue as apiUpdateIssue,
  type UpdateIssuePayload,
} from '@/api/issues'
import { ApiError } from '@/api/types'
import { refreshKanbanBoard } from '@/features/kanban/kanbanRefreshBridge'
import { showToast } from '@/features/toast/toast'
import { useIssues } from '@/contexts/IssuesContext'
import { useSprints } from '@/contexts/SprintsContext'
import {
  getIssueById,
  moveIssuesToSprint,
  removeIssueFromRegistry,
  updateIssueInRegistry,
  upsertApiIssue,
} from '@/services/issuesRegistry'
import { mapIssueDetailToUi } from '@/services/mapIssueApi'
import { syncProjectOpenIssueCount } from '@/services/projectStats'
import {
  mapPriorityLevelToKanban,
  type IssuePriorityLevel,
  type ProjectIssue,
} from '@/types/issues'
import { UNASSIGNED_ASSIGNEE } from '@/utils/assigneeColors'

type Snapshot = {
  issues: Map<string, ProjectIssue>
}

function snapshotIssues(issueIds: string[]): Snapshot {
  const issues = new Map<string, ProjectIssue>()
  for (const issueId of issueIds) {
    const issue = getIssueById(issueId)
    if (issue) issues.set(issueId, { ...issue })
  }
  return { issues }
}

function restoreSnapshot(snapshot: Snapshot): void {
  snapshot.issues.forEach((issue, issueId) => {
    updateIssueInRegistry(issueId, issue)
  })
}

export function useOptimisticIssueActions(projectId: string) {
  const { updateIssue, refresh } = useIssues()
  const { loadProjectSprints } = useSprints()
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  const markPending = useCallback((issueIds: string[], pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev)
      for (const issueId of issueIds) {
        if (pending) next.add(issueId)
        else next.delete(issueId)
      }
      return next
    })
  }, [])

  const applyApiIssue = useCallback(
    (issue: ProjectIssue) => {
      upsertApiIssue(issue)
      refresh()
      refreshKanbanBoard()
    },
    [refresh],
  )

  const patchIssue = useCallback(
    async (issueId: string, optimistic: Partial<ProjectIssue>, payload: UpdateIssuePayload) => {
      const previous = getIssueById(issueId)
      if (!previous) return

      updateIssue(issueId, optimistic)
      markPending([issueId], true)

      try {
        const updated = await apiUpdateIssue(issueId, payload)
        applyApiIssue(mapIssueDetailToUi(updated, projectId))
      } catch (error) {
        updateIssue(issueId, previous)
        const message =
          error instanceof ApiError ? error.message : 'Failed to update issue.'
        showToast(message, 'error')
        throw error
      } finally {
        markPending([issueId], false)
      }
    },
    [applyApiIssue, markPending, projectId, updateIssue],
  )

  const assignUser = useCallback(
    async (issueId: string, userId: string | null, member?: { name: string; color: string }) => {
      await patchIssue(
        issueId,
        {
          assigneeId: userId,
          assignee:
            userId && member
              ? {
                  name: member.name,
                  color: member.color,
                  userId,
                  email: member.email,
                }
              : UNASSIGNED_ASSIGNEE,
        },
        { assignee: userId },
      )
    },
    [patchIssue],
  )

  const setPriority = useCallback(
    async (issueId: string, priority: IssuePriorityLevel) => {
      await patchIssue(
        issueId,
        {
          priorityLevel: priority,
          priority: mapPriorityLevelToKanban(priority),
        },
        { priority },
      )
    },
    [patchIssue],
  )

  const setTitle = useCallback(
    async (issueId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      await patchIssue(issueId, { title: trimmed }, { title: trimmed })
    },
    [patchIssue],
  )

  const setLabels = useCallback(
    async (issueId: string, labelIds: string[], labelNames: string[]) => {
      await patchIssue(
        issueId,
        {
          labelIds,
          labels: labelNames,
          label: labelNames[0] ?? getIssueById(issueId)?.label ?? 'task',
        },
        { labels: labelIds },
      )
    },
    [patchIssue],
  )

  const assignSprint = useCallback(
    async (issueId: string, sprintId: string | null) => {
      const previous = getIssueById(issueId)
      if (!previous) return

      updateIssue(issueId, { sprintId })
      markPending([issueId], true)

      try {
        await bulkAssignSprint([issueId], sprintId)
        moveIssuesToSprint([issueId], sprintId)
        refresh()
        refreshKanbanBoard()
        void loadProjectSprints(projectId)
        void syncProjectOpenIssueCount(projectId)
      } catch (error) {
        updateIssue(issueId, previous)
        const message =
          error instanceof ApiError ? error.message : 'Failed to move issue.'
        showToast(message, 'error')
        throw error
      } finally {
        markPending([issueId], false)
      }
    },
    [loadProjectSprints, markPending, projectId, refresh, updateIssue],
  )

  const bulkAssignSprintOptimistic = useCallback(
    async (issueIds: string[], sprintId: string | null) => {
      if (issueIds.length === 0) return

      const snapshot = snapshotIssues(issueIds)
      moveIssuesToSprint(issueIds, sprintId)
      refresh()
      markPending(issueIds, true)

      try {
        await bulkAssignSprint(issueIds, sprintId)
        refreshKanbanBoard()
        void loadProjectSprints(projectId)
        void syncProjectOpenIssueCount(projectId)
      } catch (error) {
        restoreSnapshot(snapshot)
        refresh()
        const message =
          error instanceof ApiError ? error.message : 'Failed to update issues.'
        showToast(message, 'error')
        throw error
      } finally {
        markPending(issueIds, false)
      }
    },
    [loadProjectSprints, markPending, projectId, refresh],
  )

  const bulkPatchIssues = useCallback(
    async (issueIds: string[], optimistic: Partial<ProjectIssue>, payload: UpdateIssuePayload) => {
      if (issueIds.length === 0) return

      const snapshot = snapshotIssues(issueIds)
      for (const issueId of issueIds) {
        updateIssue(issueId, optimistic)
      }
      markPending(issueIds, true)

      try {
        await Promise.all(issueIds.map((issueId) => apiUpdateIssue(issueId, payload)))
        for (const issueId of issueIds) {
          const current = getIssueById(issueId)
          if (current) upsertApiIssue({ ...current, ...optimistic })
        }
        refresh()
        refreshKanbanBoard()
      } catch (error) {
        restoreSnapshot(snapshot)
        refresh()
        const message =
          error instanceof ApiError ? error.message : 'Failed to update issues.'
        showToast(message, 'error')
        throw error
      } finally {
        markPending(issueIds, false)
      }
    },
    [markPending, refresh, updateIssue],
  )

  const bulkDelete = useCallback(
    async (issueIds: string[]) => {
      if (issueIds.length === 0) return

      const snapshot = snapshotIssues(issueIds)
      for (const issueId of issueIds) {
        removeIssueFromRegistry(issueId)
      }
      refresh()
      markPending(issueIds, true)

      try {
        await Promise.all(issueIds.map((issueId) => apiDeleteIssue(issueId)))
        refreshKanbanBoard()
        void syncProjectOpenIssueCount(projectId)
      } catch (error) {
        restoreSnapshot(snapshot)
        refresh()
        const message =
          error instanceof ApiError ? error.message : 'Failed to delete issues.'
        showToast(message, 'error')
        throw error
      } finally {
        markPending(issueIds, false)
      }
    },
    [markPending, projectId, refresh],
  )

  return {
    pendingIds,
    patchIssue,
    assignUser,
    setTitle,
    setPriority,
    setLabels,
    assignSprint,
    bulkAssignSprintOptimistic,
    bulkPatchIssues,
    bulkDelete,
  }
}
