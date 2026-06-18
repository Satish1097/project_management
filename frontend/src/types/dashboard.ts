export type DashboardSummaryApi = {
  visible_project_count: number
  active_sprint_count: number
  open_issue_count: number
  assigned_to_me_count: number
  overdue_issue_count: number
  unread_notification_count: number
}

export type DashboardActivityApi = {
  id: string
  actor: string | null
  event_type: string
  issue?: {
    id: string
    key?: string
    title?: string
  } | null
  project?: {
    id: string
    name?: string
  } | null
  timestamp: string
}
