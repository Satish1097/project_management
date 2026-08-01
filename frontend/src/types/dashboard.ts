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

export type DashboardProjectApi = {
  id: string
  name: string
  key: string
  open_issue_count: number
  progress_percent?: number
  active_sprint?: {
    id: string
    name: string
  } | null
}

export type DashboardAssignedTaskApi = {
  id: string
  key: string
  title: string
  status: {
    id?: string
    name: string
    category?: string
  }
  project: {
    id: string
    name?: string
    key?: string
  }
  priority?: string
  due_date?: string | null
}

export type DashboardActiveSprintContextApi = {
  project: {
    id: string
    name: string
    key?: string
  }
  sprint: {
    id: string
    name: string
    progress_percentage: number
    completed_issues: number
    remaining_issues: number
    start_date?: string | null
    end_date?: string | null
  }
}

export type DashboardIssueStatusItemApi = {
  category: string
  label: string
  count: number
}

export type DashboardWorkloadApi = {
  total_assigned: number
  overdue: number
  due_soon: number
  high_priority: number
  by_status_category: DashboardIssueStatusItemApi[]
  by_priority: Array<{
    priority: string
    count: number
  }>
}

/** Mapped client shape for the workspace dashboard endpoint. */
export type WorkspaceDashboardApi = {
  summary: DashboardSummaryApi
  projects: DashboardProjectApi[]
  tasks: DashboardAssignedTaskApi[]
  activities: DashboardActivityApi[]
  activeSprints: DashboardActiveSprintContextApi[]
  workload?: DashboardWorkloadApi | null
  issueStatus?: DashboardIssueStatusItemApi[] | null
}
