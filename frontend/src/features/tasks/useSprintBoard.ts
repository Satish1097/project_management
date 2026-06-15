import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSprintBoard } from '@/api/sprints'
import { transitionIssue as apiTransitionIssue } from '@/api/issues'
import { ApiError } from '@/api/types'
import { getSprintIssues } from '@/services/issuesRegistry'
import { mapKanbanBoardToColumns } from '@/services/mapKanbanApi'
import { getProjectById } from '@/services/projectData'
import { getWorkflowColumns, groupTasksByStatus } from './issueWorkflow'
import { projectIssueToBoardTask } from '@/utils/projectIssueBoard'
import type { TaskStatus } from '@/types/tasks'

export function useSprintBoard(projectId: string, sprintId: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [boardVersion, setBoardVersion] = useState(0)
  const project = getProjectById(projectId)
  const columns = useMemo(
    () => getWorkflowColumns(projectId),
    [projectId],
  )

  const loadBoard = useCallback(async () => {
    if (!projectId || !sprintId) return

    setLoading(true)
    setError(null)

    try {
      const board = await getSprintBoard(sprintId)
      mapKanbanBoardToColumns(board, projectId)
      setBoardVersion((version) => version + 1)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load sprint board.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [projectId, sprintId])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  const sprintIssues = useMemo(
    () => getSprintIssues(projectId, sprintId),
    [projectId, sprintId, boardVersion],
  )

  const boardTasks = useMemo(
    () => sprintIssues.map((issue) => projectIssueToBoardTask(issue, project)),
    [sprintIssues, project],
  )

  const tasksByStatus = useMemo(
    () => groupTasksByStatus(boardTasks, columns),
    [boardTasks, columns],
  )

  const totalVisible = useMemo(
    () => boardTasks.length,
    [boardTasks],
  )

  const moveTaskToStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      void apiTransitionIssue(taskId, status, projectId)
        .then(() => loadBoard())
        .catch(() => {
          void loadBoard()
        })
    },
    [loadBoard, projectId],
  )

  return {
    columns,
    tasksByStatus,
    totalVisible,
    moveTaskToStatus,
    loading,
    error,
    refreshBoard: loadBoard,
  }
}
