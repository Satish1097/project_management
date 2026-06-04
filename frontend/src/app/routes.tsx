import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { WorkspaceEmptyShell } from '@/components/layout/WorkspaceEmptyShell'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { ROUTES } from '@/constants/routes'
import { GuestRoute } from '@/app/guards/GuestRoute'
import { ProtectedRoute } from '@/app/guards/ProtectedRoute'
import { AuthLayoutRoute } from '@/app/layouts/AuthLayoutRoute'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForbiddenPage } from '@/features/errors/ForbiddenPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
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

/**
 * Route tree:
 * - Guest auth routes (login, signup, forgot-password) with AuthLayout
 * - Protected app routes (ops Sidebar layout)
 * - Protected workspace routes (WorkspaceSidebar layout)
 * - Protected full-page routes (board overlays, no shell)
 * - Public error routes
 */
export const router = createBrowserRouter([
  // ─── Authentication (guest only) ───────────────────────────────────────
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayoutRoute />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.signup, element: <SignupPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
        ],
      },
    ],
  },

  // ─── Protected application ───────────────────────────────────────────────
  {
    element: <ProtectedRoute />,
    children: [
      // Ops shell: dashboard, board, settings, delivery modules
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'board', element: <BoardPage /> },
          { path: 'projects/settings', element: <ProjectSettingsPage /> },
          { path: 'operations', element: <OperationsDashboardPage /> },
          { path: 'qa', element: <QAManagementPage /> },
          { path: 'releases', element: <ReleaseManagementPage /> },
        ],
      },

      // Workspace shell: issues, search, inbox, project hub
      {
        element: <WorkspaceShell />,
        children: [
          { path: 'tasks', element: <MyTasksPage /> },
          { path: 'search', element: <GlobalSearchPage /> },
          { path: 'notifications', element: <NotificationCenterPage /> },
          { path: 'workspace/settings', element: <WorkspaceSettingsPage /> },
          { path: 'projects/settings/labels', element: <ProjectSettingsLabelsPage /> },
        ],
      },

      // Empty workspace onboarding shell
      {
        element: <WorkspaceEmptyShell />,
        children: [
          { path: 'workspace/empty', element: <EmptyWorkspacePage /> },
        ],
      },

      // Full-page board flows (no persistent shell)
      { path: 'board/advanced', element: <AdvancedBoardPage /> },
      { path: 'board/issue', element: <IssueDetailDrawerPage /> },
      { path: 'board/issue/enhanced', element: <EnhancedIssueDrawerPage /> },
    ],
  },

  // ─── Error routes (public) ─────────────────────────────────────────────
  { path: ROUTES.forbidden, element: <ForbiddenPage /> },
  { path: ROUTES.notFound, element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
])
