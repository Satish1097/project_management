export type DashboardSummaryResponseApi = {
  total_visible_projects: number
  active_projects: number
  active_sprints: number
  open_issues: number
  assigned_to_me: number
  overdue_issues: number
  unread_notification_count: number
}

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
