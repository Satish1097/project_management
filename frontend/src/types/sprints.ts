export type SprintStatus = 'active' | 'planned' | 'completed'

export type Sprint = {
  id: string
  projectId: string
  name: string
  status: SprintStatus
  dateRange: string
  issueCount: number
  completedCount: number
  goal?: string
  /** Remaining days for active sprints (display only). */
  daysRemaining?: number
}
