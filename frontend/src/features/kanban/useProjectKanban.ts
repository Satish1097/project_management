import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProjectKanban } from '@/api/issues'
import { getProjectMembers, type ProjectMemberRecord } from '@/api/members'
import { getSprintBoard } from '@/api/sprints'
import { ApiError } from '@/api/types'
import {
  DEFAULT_KANBAN_FILTERS,
  filterKanbanColumns,
} from '@/features/kanban/kanbanFilters'
import { registerKanbanRefresh } from '@/features/kanban/kanbanRefreshBridge'
import { mapKanbanBoardToColumns } from '@/services/mapKanbanApi'
import type { KanbanBoardFilters, KanbanColumn } from '@/types/kanban'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type UseProjectKanbanOptions = {
  sprintId?: string
  enabled?: boolean
}

export function useProjectKanban(
  projectId: string,
  options: UseProjectKanbanOptions = {},
) {
  const { sprintId, enabled = true } = options
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<KanbanBoardFilters>(DEFAULT_KANBAN_FILTERS)
  const [members, setMembers] = useState<ProjectMemberRecord[]>([])

  const loadBoard = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoading(false)
      return
    }
    if (sprintId && !UUID_RE.test(sprintId)) return

    setLoading(true)
    setError(null)

    try {
      const board = sprintId
        ? await getSprintBoard(projectId, sprintId)
        : await getProjectKanban(projectId)
      setColumns(mapKanbanBoardToColumns(board, projectId))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load kanban board.'
      setError(message)
      setColumns([])
    } finally {
      setLoading(false)
    }
  }, [projectId, sprintId, enabled])

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

  return {
    columns: filteredColumns,
    rawColumns: columns,
    loading,
    error,
    totalIssues,
    filteredIssueCount,
    filters,
    setFilters,
    clearFilters,
    assigneeOptions,
    refreshBoard: loadBoard,
  }
}
