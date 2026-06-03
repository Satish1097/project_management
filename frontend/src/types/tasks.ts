import type { LucideIcon } from 'lucide-react'

export type TaskPriority = 'high' | 'medium' | 'low' | 'none'

export type TaskStatus = 'in_progress' | 'todo' | 'backlog'

export type Task = {
  id: string
  key: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  project: string
  projectIcon: LucideIcon
  label: string
  labelVariant?: 'default' | 'critical'
  dueDate: string
  dueOverdue?: boolean
}
