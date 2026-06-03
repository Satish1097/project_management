import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ROUTES } from '@/constants/routes'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { BoardPage } from '@/features/kanban/BoardPage'
import { AdvancedBoardPage } from '@/features/kanban/AdvancedBoardPage'
import { EmptyWorkspacePage } from '@/features/workspace/EmptyWorkspacePage'
import { MyTasksPage } from '@/features/tasks/MyTasksPage'
import { ProjectSettingsPage } from '@/features/settings/ProjectSettingsPage'
import { ProjectSettingsLabelsPage } from '@/features/settings/ProjectSettingsLabelsPage'
import { WorkspaceSettingsPage } from '@/features/settings/WorkspaceSettingsPage'
import { IssueDetailDrawerPage } from '@/features/issues/IssueDetailDrawerPage'
import { EnhancedIssueDrawerPage } from '@/features/issues/EnhancedIssueDrawerPage'
import { NotificationCenterPage } from '@/features/notifications/NotificationCenterPage'
import { GlobalSearchPage } from '@/features/search/GlobalSearchPage'
import { OperationsDashboardPage } from '@/features/operations/OperationsDashboardPage'
import { QAManagementPage } from '@/features/qa/QAManagementPage'
import { ReleaseManagementPage } from '@/features/releases/ReleaseManagementPage'
import { WorkspaceEmptyShell } from '@/components/layout/WorkspaceEmptyShell'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'

export const router = createBrowserRouter([
  {
    path: ROUTES.login,
    element: <LoginPage />,
  },
  {
    path: ROUTES.signup,
    element: <SignupPage />,
  },
  {
    element: <WorkspaceEmptyShell />,
    children: [
      {
        path: ROUTES.workspaceEmpty,
        element: <EmptyWorkspacePage />,
      },
    ],
  },
  {
    element: <WorkspaceShell activeNav="myIssues" />,
    children: [
      {
        path: ROUTES.myTasks,
        element: <MyTasksPage />,
      },
    ],
  },
  {
    path: ROUTES.projectSettingsLabels,
    element: <ProjectSettingsLabelsPage />,
  },
  {
    path: ROUTES.workspaceSettings,
    element: <WorkspaceSettingsPage />,
  },
  {
    path: ROUTES.notifications,
    element: <NotificationCenterPage />,
  },
  {
    path: ROUTES.search,
    element: <GlobalSearchPage />,
  },
  {
    path: ROUTES.operations,
    element: <OperationsDashboardPage />,
  },
  {
    path: ROUTES.qa,
    element: <QAManagementPage />,
  },
  {
    path: ROUTES.releases,
    element: <ReleaseManagementPage />,
  },
  {
    path: ROUTES.issueDetail,
    element: <IssueDetailDrawerPage />,
  },
  {
    path: ROUTES.issueDetailEnhanced,
    element: <EnhancedIssueDrawerPage />,
  },
  {
    path: ROUTES.advancedBoard,
    element: <AdvancedBoardPage />,
  },
  {
    element: <AppShell />,
    children: [
      {
        path: ROUTES.dashboard,
        element: <DashboardPage />,
      },
      {
        path: ROUTES.board,
        element: <BoardPage />,
      },
      {
        path: ROUTES.projectSettings,
        element: <ProjectSettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={ROUTES.login} replace />,
  },
])
