import { createBrowserRouter, Navigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectShell } from '@/components/layout/ProjectShell'
import {
  DEFAULT_BOARD_CONTEXT,
  ROUTES,
  projectSettingsGeneralPath,
  projectSettingsLabelsPath,
  projectSettingsMembersPath,
  projectBacklogSprintPath,
  sprintAdvancedBoardPath,
  sprintIssueDetailEnhancedPath,
  sprintIssueDetailPath,
} from '@/constants/routes'
import { GuestRoute } from '@/app/guards/GuestRoute'
import { ProtectedRoute } from '@/app/guards/ProtectedRoute'
import { AuthLayoutRoute } from '@/app/layouts/AuthLayoutRoute'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { ForbiddenPage } from '@/features/errors/ForbiddenPage'
import { NotFoundPage } from '@/features/errors/NotFoundPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { WorkspaceActivityPage } from '@/features/dashboard/WorkspaceActivityPage'
import { AdvancedBoardPage } from '@/features/kanban/AdvancedBoardPage'
import { EmptyWorkspacePage } from '@/features/workspace/EmptyWorkspacePage'
import { WorkspaceModulePlaceholderPage } from '@/features/workspace/WorkspaceModulePlaceholderPage'
import { WorkspaceSprintsPage } from '@/features/sprints/WorkspaceSprintsPage'
import { MyTasksPage } from '@/features/tasks/MyTasksPage'
import { ProjectSettingsLayout } from '@/components/layout/ProjectSettingsLayout'
import { ProjectSettingsGeneralPage } from '@/features/settings/ProjectSettingsGeneralPage'
import { ProjectSettingsMembersPage } from '@/features/settings/ProjectSettingsMembersPage'
import { ProjectSettingsLabelsPage } from '@/features/settings/ProjectSettingsLabelsPage'
import { ProjectSettingsStatusesPage } from '@/features/settings/ProjectSettingsStatusesPage'
import { ProjectSettingsIntegrationsPage } from '@/features/settings/ProjectSettingsIntegrationsPage'
import { IssueDetailDrawerPage } from '@/features/issues/IssueDetailDrawerPage'
import { EnhancedIssueDrawerPage } from '@/features/issues/EnhancedIssueDrawerPage'
import { NotificationCenterPage } from '@/features/notifications/NotificationCenterPage'
import { GlobalSearchPage } from '@/features/search/GlobalSearchPage'
import { OperationsDashboardPage } from '@/features/operations/OperationsDashboardPage'
import { QAManagementPage } from '@/features/qa/QAManagementPage'
import { ReleaseManagementPage } from '@/features/releases/ReleaseManagementPage'
import { ProjectsListPage } from '@/features/projects/ProjectsListPage'
import { ProjectOverviewPage } from '@/features/projects/ProjectOverviewPage'
import { ProjectActivityPage } from '@/features/projects/ProjectActivityPage'
import { ProjectSprintsPage } from '@/features/projects/ProjectSprintsPage'
import { ProjectPlaceholderPage } from '@/features/projects/ProjectPlaceholderPage'
import { ProjectTeamPage } from '@/features/projects/ProjectTeamPage'
import { ProjectBacklogPage } from '@/features/projects/ProjectBacklogPage'
import { SprintShell } from '@/components/layout/SprintShell'
import { ProjectKanbanPage } from '@/features/kanban/ProjectKanbanPage'
import { SprintBoardPage } from '@/features/projects/SprintBoardPage'
import { SprintDetailPage } from '@/features/projects/SprintDetailPage'
import { SprintListPage } from '@/features/projects/SprintListPage'
import { SprintActivityPage } from '@/features/projects/SprintActivityPage'
import { BoardLegacyRedirect } from '@/features/projects/BoardLegacyRedirect'

const { projectId: defaultProjectId, sprintId: defaultSprintId } =
  DEFAULT_BOARD_CONTEXT

function SprintPlanningRedirect() {
  const { projectId = '', sprintId = '' } = useParams()
  return (
    <Navigate to={projectBacklogSprintPath(projectId, sprintId)} replace />
  )
}

/**
 * Route tree:
 * - Guest auth routes (login, signup, forgot-password) with AuthLayout
 * - Protected app routes (unified AppShell + Sidebar)
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
          { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
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
          { path: 'tasks', element: <MyTasksPage /> },
          { path: 'search', element: <GlobalSearchPage /> },
          { path: 'notifications', element: <NotificationCenterPage /> },
          { path: 'sprints', element: <WorkspaceSprintsPage /> },
          {
            path: 'roadmaps',
            element: (
              <WorkspaceModulePlaceholderPage
                title="Roadmaps"
                description="Timeline and initiative planning across projects."
              />
            ),
          },
          { path: 'workspace/empty', element: <EmptyWorkspacePage /> },
          { path: 'workspace/activity', element: <WorkspaceActivityPage /> },
          { path: 'projects', element: <ProjectsListPage /> },
          {
            path: 'projects/:projectId',
            element: <ProjectShell />,
            children: [
              { index: true, element: <ProjectOverviewPage /> },
              { path: 'activity', element: <ProjectActivityPage /> },
              { path: 'backlog', element: <ProjectBacklogPage /> },
              { path: 'board', element: <ProjectKanbanPage /> },
              { path: 'sprints', element: <ProjectSprintsPage /> },
              {
                path: 'sprints/:sprintId',
                element: <SprintShell />,
                children: [
                  { index: true, element: <SprintDetailPage /> },
                  {
                    path: 'planning',
                    element: <SprintPlanningRedirect />,
                  },
                  { path: 'board', element: <SprintBoardPage /> },
                  { path: 'list', element: <SprintListPage /> },
                  { path: 'activity', element: <SprintActivityPage /> },
                ],
              },
              { path: 'team', element: <ProjectTeamPage /> },
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
                element: <ProjectSettingsLayout />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="general" replace />,
                  },
                  { path: 'general', element: <ProjectSettingsGeneralPage /> },
                  { path: 'members', element: <ProjectSettingsMembersPage /> },
                  { path: 'statuses', element: <ProjectSettingsStatusesPage /> },
                  { path: 'labels', element: <ProjectSettingsLabelsPage /> },
                  {
                    path: 'integrations',
                    element: <ProjectSettingsIntegrationsPage />,
                  },
                ],
              },
            ],
          },
          {
            path: 'projects/settings',
            element: (
              <Navigate
                to={projectSettingsGeneralPath(DEFAULT_BOARD_CONTEXT.projectId)}
                replace
              />
            ),
          },
          {
            path: 'projects/settings/labels',
            element: (
              <Navigate
                to={projectSettingsLabelsPath(DEFAULT_BOARD_CONTEXT.projectId)}
                replace
              />
            ),
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
          {
            path: 'workspace/settings',
            element: (
              <Navigate
                to={projectSettingsMembersPath(DEFAULT_BOARD_CONTEXT.projectId)}
                replace
              />
            ),
          },
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
