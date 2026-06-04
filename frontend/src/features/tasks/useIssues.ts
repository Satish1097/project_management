import { useCallback, useMemo, useState } from 'react'
import { mockAssignedTasks } from '@/services/mockTasks'
import type {
  IssueFilters,
  IssueSortKey,
  IssueViewMode,
  Task,
  TaskStatus,
} from '@/types/tasks'
import {
  applyIssueFilters,
  filterByAssigneeTab,
  sortIssues,
  type AssigneeTab,
} from './issueFilters'
import { groupTasksByStatus } from './issueWorkflow'

const defaultFilters: IssueFilters = {
  status: 'all',
  priority: 'all',
  project: 'all',
}

export function useIssues() {
  const [tasks, setTasks] = useState<Task[]>(mockAssignedTasks)
  const [viewMode, setViewMode] = useState<IssueViewMode>('list')
  const [assigneeTab, setAssigneeTab] = useState<AssigneeTab>('assigned')
  const [filters, setFilters] = useState<IssueFilters>(defaultFilters)
  const [sortKey, setSortKey] = useState<IssueSortKey>('default')

  const visibleTasks = useMemo(() => {
    const tabbed = filterByAssigneeTab(tasks, assigneeTab)
    const filtered = applyIssueFilters(tabbed, filters)
    return sortIssues(filtered, sortKey)
  }, [tasks, assigneeTab, filters, sortKey])

  const tasksByStatus = useMemo(
    () => groupTasksByStatus(visibleTasks),
    [visibleTasks],
  )

  const moveTaskToStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    )
  }, [])

  const updateFilter = useCallback(
    <K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const cycleSort = useCallback(() => {
    setSortKey((prev) => {
      const order: IssueSortKey[] = [
        'default',
        'priority',
        'dueDate',
        'title',
      ]
      const idx = order.indexOf(prev)
      return order[(idx + 1) % order.length]
    })
  }, [])

  return {
    tasks,
    visibleTasks,
    tasksByStatus,
    viewMode,
    setViewMode,
    assigneeTab,
    setAssigneeTab,
    filters,
    updateFilter,
    sortKey,
    cycleSort,
    moveTaskToStatus,
  }
}
