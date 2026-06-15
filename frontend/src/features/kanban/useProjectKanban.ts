import { useCallback, useEffect, useMemo, useState } from 'react'
import { getKanban, transitionIssue as apiTransitionIssue } from '@/api/issues'
import { getProjectMembers, type ProjectMemberRecord } from '@/api/members'
import { ApiError } from '@/api/types'
import {
  DEFAULT_KANBAN_FILTERS,
  filterKanbanColumns,
} from '@/features/kanban/kanbanFilters'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import { mapKanbanBoardToColumns } from '@/services/mapKanbanApi'
import type { KanbanBoardFilters, KanbanColumn } from '@/types/kanban'

const TRANSITION_BLOCKED_MESSAGE = 'Cannot move issue to this status'

export function useProjectKanban(projectId: string) {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [transitioningIssueId, setTransitioningIssueId] = useState<string | null>(null)
  const [filters, setFilters] = useState<KanbanBoardFilters>(DEFAULT_KANBAN_FILTERS)
  const [members, setMembers] = useState<ProjectMemberRecord[]>([])

  const loadBoard = useCallback(async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      const board = await getKanban(projectId)
      setColumns(mapKanbanBoardToColumns(board, projectId))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load kanban board.'
      setError(message)
      setColumns([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    if (!projectId) return

    void getProjectMembers(projectId)
      .then(setMembers)
      .catch(() => {
        setMembers([])
      })
  }, [projectId])

  useEffect(() => {
    return registerKanbanRefresh(() => {
      void loadBoard()
    })
  }, [loadBoard])

  const filteredColumns = useMemo(
    () => filterKanbanColumns(columns, filters),
    [columns, filters],
  )

  const totalIssues = useMemo(
    () => columns.reduce((sum, column) => sum + column.issues.length, 0),
    [columns],
  )

  const filteredIssueCount = useMemo(
    () => filteredColumns.reduce((sum, column) => sum + column.issues.length, 0),
    [filteredColumns],
  )

  const assigneeOptions = useMemo(() => {
    const seen = new Set<string>()
    const fromBoard: ProjectMemberRecord[] = []

    for (const column of columns) {
      for (const issue of column.issues) {
        if (!issue.assigneeId || seen.has(issue.assigneeId)) continue
        seen.add(issue.assigneeId)
        const member = members.find((item) => item.user_id === issue.assigneeId)
        fromBoard.push({
          user_id: issue.assigneeId,
          project_id: projectId,
          role: member?.role ?? 'member',
          display_name: member?.display_name ?? issue.assignee.name,
          email: member?.email,
        })
      }
    }

    const memberOptions = members.filter((member) => !seen.has(member.user_id))
    return [...fromBoard, ...memberOptions]
  }, [columns, members, projectId])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_KANBAN_FILTERS)
  }, [])

  const transitionIssueOnBoard = useCallback(
    async (issueId: string, transitionSlug: string, sourceColumnId: string) => {
      if (sourceColumnId === transitionSlug) return

      setTransitionError(null)
      setTransitioningIssueId(issueId)

      try {
        await apiTransitionIssue(issueId, transitionSlug, projectId)
        await loadBoard()
      } catch (err) {
        const message =
          err instanceof ApiError && (err.status === 400 || err.status === 403)
            ? TRANSITION_BLOCKED_MESSAGE
            : err instanceof ApiError
              ? err.message
              : 'Failed to transition issue.'
        setTransitionError(message)
        await loadBoard()
        throw err
      } finally {
        setTransitioningIssueId(null)
      }
    },
    [loadBoard, projectId],
  )

  return {
    columns: filteredColumns,
    rawColumns: columns,
    loading,
    error,
    transitionError,
    transitioningIssueId,
    totalIssues,
    filteredIssueCount,
    filters,
    setFilters,
    clearFilters,
    assigneeOptions,
    refreshBoard: loadBoard,
    transitionIssueOnBoard,
  }
}
