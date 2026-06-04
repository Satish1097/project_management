import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { WorkspaceEmptyShell } from '@/components/layout/WorkspaceEmptyShell'
import { WorkspaceShell } from '@/components/layout/WorkspaceShell'
import { ProjectShell } from '@/components/layout/ProjectShell'
import {
  DEFAULT_BOARD_CONTEXT,
  ROUTES,
  sprintAdvancedBoardPath,
  sprintIssueDetailEnhancedPath,
  sprintIssueDetailPath,
} from '@/constants/routes'
import { GuestRoute } from '@/app/guards/GuestRoute'
import { ProtectedRoute } from '@/app/guards/ProtectedRoute'
import { AuthLayoutRoute } from '@/app/layouts/AuthLayoutRoute'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForbiddenPage } from '@/features/errors/ForbiddenPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
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
import { ProjectsListPage } from '@/features/projects/ProjectsListPage'
import { ProjectOverviewPage } from '@/features/projects/ProjectOverviewPage'
import { ProjectSprintsPage } from '@/features/projects/ProjectSprintsPage'
import { ProjectPlaceholderPage } from '@/features/projects/ProjectPlaceholderPage'
import { ProjectBacklogPage } from '@/features/projects/ProjectBacklogPage'
import { SprintDetailPage } from '@/features/projects/SprintDetailPage'
import { SprintPlanningPage } from '@/features/projects/SprintPlanningPage'
import { SprintBoardPage } from '@/features/projects/SprintBoardPage'
import { SprintListPage } from '@/features/projects/SprintListPage'
import { SprintActivityPage } from '@/features/projects/SprintActivityPage'
import { BoardLegacyRedirect } from '@/features/projects/BoardLegacyRedirect'

const { projectId: defaultProjectId, sprintId: defaultSprintId } =
  DEFAULT_BOARD_CONTEXT

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
      {
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'projects', element: <ProjectsListPage /> },
          {
            path: 'projects/:projectId',
            element: <ProjectShell />,
            children: [
              { index: true, element: <ProjectOverviewPage /> },
              { path: 'backlog', element: <ProjectBacklogPage /> },
              { path: 'sprints', element: <ProjectSprintsPage /> },
              { path: 'sprints/:sprintId', element: <SprintDetailPage /> },
              {
                path: 'sprints/:sprintId/planning',
                element: <SprintPlanningPage />,
              },
              {
                path: 'team',
                element: (
                  <ProjectPlaceholderPage
                    title="Team"
                    description="Members, roles, and project access."
                  />
                ),
              },
              {
                path: 'releases',
                element: (
                  <ProjectPlaceholderPage
                    title="Releases"
                    description="Versions and deployments for this project."
                  />
                ),
              },
              {
                path: 'reports',
                element: (
                  <ProjectPlaceholderPage
                    title="Reports"
                    description="Velocity, burndown, and delivery metrics."
                  />
                ),
              },
              {
                path: 'settings',
                element: (
                  <ProjectPlaceholderPage
                    title="Settings"
                    description="Project identity, workflow, and integrations."
                  />
                ),
              },
              { path: 'sprints/:sprintId/board', element: <SprintBoardPage /> },
              { path: 'sprints/:sprintId/list', element: <SprintListPage /> },
              {
                path: 'sprints/:sprintId/activity',
                element: <SprintActivityPage />,
              },
            ],
          },
          {
            path: 'projects/settings',
            element: <ProjectSettingsPage />,
          },
          { path: 'operations', element: <OperationsDashboardPage /> },
          { path: 'qa', element: <QAManagementPage /> },
          { path: 'releases', element: <ReleaseManagementPage /> },
          // Legacy top-level board → project sprint board
          { path: 'board', element: <BoardLegacyRedirect /> },
          {
            path: 'board/advanced',
            element: (
              <Navigate
                to={sprintAdvancedBoardPath(defaultProjectId, defaultSprintId)}
                replace
              />
            ),
          },
        ],
      },

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

      {
        element: <WorkspaceEmptyShell />,
        children: [
          { path: 'workspace/empty', element: <EmptyWorkspacePage /> },
        ],
      },

      {
        path: 'projects/:projectId/sprints/:sprintId/board/advanced',
        element: <AdvancedBoardPage />,
      },
      {
        path: 'projects/:projectId/sprints/:sprintId/board/issue',
        element: <IssueDetailDrawerPage />,
      },
      {
        path: 'projects/:projectId/sprints/:sprintId/board/issue/enhanced',
        element: <EnhancedIssueDrawerPage />,
      },
      // Legacy issue/board overlays
      {
        path: 'board/issue',
        element: (
          <Navigate
            to={sprintIssueDetailPath(defaultProjectId, defaultSprintId)}
            replace
          />
        ),
      },
      {
        path: 'board/issue/enhanced',
        element: (
          <Navigate
            to={sprintIssueDetailEnhancedPath(
              defaultProjectId,
              defaultSprintId,
            )}
            replace
          />
        ),
      },
    ],
  },

  { path: ROUTES.forbidden, element: <ForbiddenPage /> },
  { path: ROUTES.notFound, element: <NotFoundPage /> },
  { path: '*', element: <NotFoundPage /> },
])
