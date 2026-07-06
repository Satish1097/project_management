export type SprintStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'paused'

export type SprintDurationWeeks = '1' | '2' | '3' | '4' | 'custom'

export type Sprint = {
  id: string
  projectId: string
  name: string
  status: SprintStatus
  /** ISO date YYYY-MM-DD */
  startDate: string
  /** ISO date YYYY-MM-DD */
  endDate: string
  dateRange: string
  issueCount: number
  completedCount: number
  remainingCount: number
  inProgressCount: number
  progressPercentage: number
  goal?: string
  /** Remaining days for active sprints (display only). */
  daysRemaining?: number
  capacityPoints?: number
  durationWeeks?: SprintDurationWeeks
}
