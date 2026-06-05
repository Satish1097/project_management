import { useCallback, useMemo } from 'react'
import { useIssues } from '@/contexts/IssuesContext'
import { persistIssueStatusChange } from '@/services/issueStatusApi'
import { getProjectById } from '@/services/projectData'
import { getWorkflowColumns, groupTasksByStatus } from './issueWorkflow'
import {
  projectIssueToBoardTask,
  statusPatchForTaskStatus,
  taskStatusToWorkflowStatus,
} from '@/utils/projectIssueBoard'
import type { ProjectIssue } from '@/types/issues'
import type { TaskStatus } from '@/types/tasks'

type StatusSnapshot = Pick<
  ProjectIssue,
  'workflowStatus' | 'status' | 'done'
>

export function useSprintBoard(projectId: string, sprintId: string) {
  const { issues, updateIssue } = useIssues()
  const project = getProjectById(projectId)
  const columns = useMemo(
    () => getWorkflowColumns(projectId),
    [projectId],
  )

  const sprintIssues = useMemo(
    () =>
      issues.filter(
        (issue) =>
          issue.projectId === projectId && issue.sprintId === sprintId,
      ),
    [issues, projectId, sprintId],
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
      const issue = sprintIssues.find((item) => item.id === taskId)
      if (!issue) return

      const snapshot: StatusSnapshot = {
        workflowStatus: issue.workflowStatus,
        status: issue.status,
        done: issue.done,
      }
      const patch = statusPatchForTaskStatus(status)
      const workflowStatus = taskStatusToWorkflowStatus(status)

      updateIssue(taskId, patch)

      void persistIssueStatusChange(taskId, workflowStatus).catch(() => {
        updateIssue(taskId, snapshot)
      })
    },
    [sprintIssues, updateIssue],
  )

  return {
    columns,
    tasksByStatus,
    totalVisible,
    moveTaskToStatus,
  }
}
