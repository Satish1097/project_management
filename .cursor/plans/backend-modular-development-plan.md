# Backend Modular Development Plan (Frontend-Driven)

## 1) Frontend Analysis

### Auth screens

- **Login (`/login`)**
  - Purpose: Sign in and route to protected workspace.
  - Interactions: Email/password submit, remember me, forgot-password link, social sign-in CTA.
  - Data shown: Basic form fields.
  - Filters/sort/search: None.
  - User actions: Login.
  - Required backend ops: credential auth, JWT issue/refresh, session metadata.
  - Dependencies: Signup, forgot password, all protected routes.

- **Signup (`/signup`)**
  - Purpose: Create account and enter workspace.
  - Interactions: Name/email/password submit.
  - Data shown: Signup form.
  - User actions: Register.
  - Required backend ops: user creation, password policy checks, email verification trigger.
  - Dependencies: Empty workspace onboarding, auth.

- **Forgot Password (`/forgot-password`)**
  - Purpose: Password reset initiation.
  - Interactions: Email submit.
  - Required backend ops: reset token generation, email delivery, token validation endpoint.
  - Dependencies: Auth.

### Workspace-level screens

- **Dashboard (`/`)**
  - Purpose: Workspace snapshot and quick navigation.
  - Interactions: Open projects, my tasks, QA, releases; quick links.
  - Data shown: project count, active sprint count, open issues, release stats, activity feed.
  - Required backend ops: aggregated metrics, recent activity stream.
  - Dependencies: project, sprint, issue, activity.

- **Projects List (`/projects`)**
  - Purpose: Discover/select projects; create project.
  - Interactions: filter (all/active/completed), view mode (grid/list), create drawer.
  - Data shown: project cards, active sprint info, team count.
  - Filters: status filter + local sort by name.
  - Required backend ops: list projects, create project, include derived fields (active sprint/team/open issues).
  - Dependencies: project, sprint summary.

- **Workspace Sprints (`/sprints`)**
  - Purpose: Cross-project sprint management.
  - Interactions: search, status filter, project filter, sort, open board/planning/backlog/detail.
  - Data shown: sprint metrics and cards across projects.
  - Required backend ops: cross-project sprint query with filters + aggregate counters.
  - Dependencies: sprint, project, issue stats.

- **My Tasks (`/tasks`)**
  - Purpose: Assigned/created/watching issue workbench.
  - Interactions: assignee tab switch, filters (status/priority/project), sort cycle, list/board view, drag-drop status, open issue detail.
  - Data shown: issue list/kanban grouped by workflow status.
  - Required backend ops: personalized issue query, workflow-aware grouping, issue transition endpoint.
  - Dependencies: issue, workflow, permissions.

- **Global Search (`/search`)**
  - Purpose: Unified search across issues/projects/users.
  - Interactions: keyword search, select result, open issue detail.
  - Required backend ops: global indexed search endpoint with typed results.
  - Dependencies: issue, project, identity/user profile.

- **Notification Center (`/notifications`)**
  - Purpose: Notification inbox.
  - Interactions: tab filters (all/mentions/assigned), mark one/all read, preferences link.
  - Data shown: notification items with actor/time/project/type.
  - Required backend ops: list notifications, unread counters, mark-read APIs, preference APIs.
  - Dependencies: notification events from issue/sprint/comment/mention flows.

### Project-scoped screens

- **Project Overview (`/projects/:projectId`)**
  - Purpose: Project health summary.
  - Interactions: open active sprint board, view all sprints.
  - Data shown: open issues, active sprint, team, progress, recent activity, sprint list.
  - Required backend ops: project summary endpoint + recent activity.
  - Dependencies: project, sprint, issue, activity.

- **Project Backlog (`/projects/:projectId/backlog`)**
  - Purpose: Manage unscheduled issues.
  - Interactions: search backlog, multi-select, bulk add to sprint, drag-drop to sprint.
  - Data shown: backlog issues, planned/active sprint targets.
  - Required backend ops: backlog query, bulk assign issues to sprint, optimistic reorder/move support.
  - Dependencies: issue, sprint.

- **Project Sprints (`/projects/:projectId/sprints`)**
  - Purpose: Plan/start/complete/categorize sprints.
  - Interactions: create sprint, search/filter/sort, start sprint, open planning, complete sprint modal.
  - Data shown: active/planned/completed sprint cards and progress.
  - Required backend ops: sprint CRUD + status transitions + validation rules.
  - Dependencies: sprint, issue, workflow policy.

- **Sprint Detail (`/projects/:projectId/sprints/:sprintId`)**
  - Purpose: Sprint lifecycle control and summary.
  - Interactions: start/pause/resume/complete, open board/planning.
  - Data shown: progress, capacity, days remaining, sprint issues.
  - Required backend ops: sprint detail query; transition actions with invariant checks; burndown source data.
  - Dependencies: sprint, issue.

- **Sprint Planning (`/projects/:projectId/sprints/:sprintId/planning`)**
  - Purpose: Move issues between backlog and sprint.
  - Interactions: search; drag-drop backlog ↔ sprint.
  - Required backend ops: issue assignment/unassignment to sprint with audit trail.
  - Dependencies: issue, sprint.

- **Sprint Board (`/projects/:projectId/sprints/:sprintId/board`)**
  - Purpose: Core sprint execution kanban.
  - Interactions: board filters, drag-drop issues across columns/statuses.
  - Data shown: workflow columns and issue cards.
  - Required backend ops: board query by sprint + status transition API + transition validation.
  - Dependencies: workflow, issue, sprint.

- **Sprint List (`/projects/:projectId/sprints/:sprintId/list`)**
  - Purpose: Tabular sprint issues.
  - Interactions: open issue detail.
  - Required backend ops: sprint issue list query.
  - Dependencies: issue, sprint.

- **Sprint Activity (`/projects/:projectId/sprints/:sprintId/activity`)**
  - Purpose: Sprint-specific activity timeline.
  - Required backend ops: sprint activity feed endpoint.
  - Dependencies: activity/event stream.

- **Create Issue Drawer (global/project context)**
  - Purpose: Create issue with full metadata.
  - Interactions: fill title/description/type/priority/status/labels/project/sprint/assignee/reporter/component/story points/due date/estimate/acceptance/attachments.
  - Required backend ops: issue create, attachment upload, validation, key generation by project.
  - Dependencies: issue, project, sprint, labels, members.

- **Issue Detail Drawer / Enhanced Detail**
  - Purpose: Inspect and update issue state and collaboration artifacts.
  - Interactions: status/priority edits, assignee/labels, comments, activity, subtasks, linked issues, attachments.
  - Required backend ops: issue detail read/update, comments, attachments, watchers, links, subtasks, history.
  - Dependencies: issue_detail module over issue core.

### Project settings screens

- **General (`/projects/:projectId/settings/general`)**
  - Ops: update project name/key/description.
- **Members (`.../members`)**
  - Ops: list members/roles, invite member, role update/remove.
- **Statuses (`.../statuses`)**
  - Ops: project workflow status config.
- **Labels (`.../labels`)**
  - Ops: label CRUD + archive.
- **Integrations (`.../integrations`)**
  - Ops: external integration config CRUD.

### Placeholder/secondary modules currently UI-first

- **QA (`/qa`)**, **Operations (`/operations`)**, **Releases (`/releases`)**, **Roadmaps (`/roadmaps`)**:
  - Mostly mock/static but imply future modules: qa, release, ops/reporting, roadmap.

---

## 2) Frontend -> Backend Mapping

- **Auth pages** -> `auth` module (JWT login/refresh/logout, registration, password reset)
- **Projects list + project shell header** -> `workspace` + `project`
- **Project settings tabs** -> `project_settings` (split into `members`, `workflow`, `labels`, `integrations`)
- **Project sprints, sprint detail, workspace sprints** -> `sprint`
- **Backlog + sprint planning + create issue** -> `issue`
- **Sprint board + transitions** -> `board` (read projection) + `issue` (transition endpoint) + `workflow` (`TransitionService`)
- **My tasks + sprint list** -> `mytasks` (query facade over issue/workflow)
- **Issue detail drawers** -> `issue_detail` facade over `issue_collaboration`, `issue_attachment`, `issue_relationship`, `issue_history`
- **Dashboard + sprint activity** -> `dashboard` + `activity`
- **Notifications UI** -> `notification`
- **Global search overlay** -> `search`
- **QA/Releases/Operations placeholders** -> later `qa`, `release`, `ops_analytics`

---

## 3) Modular Backend Architecture

> **Revision note:** Board is projection-only. Transitions are centralized in `workflow.TransitionService` + `issue` transition endpoint. All authorization flows through `permissions.PermissionService`. Cross-module communication uses `apps/contracts/`.

### Module: `foundation`
- Responsibility: shared base app config, common mixins, error contracts, pagination, OpenAPI, health checks.
- Does NOT own: business entities.
- Screens: all (indirect).
- Dependencies: none.
- Backend requirements:
  - Models: none (or only audit base abstract models).
  - Services: id generator helpers, datetime utilities, domain exception classes.
  - Permissions: base DRF permission classes (thin wrappers delegating to `PermissionService`).
  - Jobs: periodic health tasks.
  - Cache: settings/config cache.
- APIs needed:
  - `GET /api/health` - service health.
  - `GET /api/meta` - version/build.
- Cursor scope:
  - Review: `backend/apps/foundation/*`, `backend/config/*`.
  - Do NOT review: feature apps.

### Module: `auth`
- Responsibility: identity, JWT auth lifecycle, password reset.
- Does NOT own: project roles/permissions beyond identity claims.
- Screens: login/signup/forgot-password, protected guard behavior.
- Dependencies: foundation, user.
- Backend requirements:
  - Models: User, AuthSession(optional), PasswordResetToken.
  - Services: login/register/reset flow, JWT issuance/refresh/blacklist.
  - Permissions: `IsAuthenticated`; claim extraction.
  - Jobs: reset-email send (Celery).
  - Cache: refresh token jti blacklist in Redis.
- APIs:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`
  - `POST /api/auth/password/forgot`
  - `POST /api/auth/password/reset`
- Cursor scope:
  - Review: `apps/auth/*`, `apps/user/models.py`, `config/jwt.py`.
  - Skip: project/sprint/issue modules.

### Module: `workspace`
- Responsibility: workspace-level aggregations and navigation datasets.
- Does NOT own: project internals.
- Screens: dashboard, workspace sprints landing metrics.
- Dependencies: project, sprint, issue, activity.
- Backend requirements:
  - Models: WorkspaceMembership (if multi-workspace).
  - Services: workspace metric aggregator.
  - Permissions: `PermissionService.can_view_workspace()`.
  - Jobs: cached KPI refresh.
  - Cache: dashboard cards, workspace sprint counters.
- APIs:
  - `GET /api/workspace/summary`
  - `GET /api/workspace/activity`
- Cursor scope:
  - Review: `apps/workspace/*`, read-only contracts in `apps/project/api`.
  - Skip: deep issue_detail internals.

### Module: `project`
- Responsibility: project CRUD + high-level project summary.
- Does NOT own: sprint lifecycle rules, issue transitions.
- Screens: projects list, project overview, create project drawer.
- Dependencies: auth/user, workspace.
- Backend requirements:
  - Models: Project, ProjectMember, ProjectPreference.
  - Services: create project, key uniqueness, summary projection.
  - Permissions: `PermissionService.can_view_project()` / `can_edit_project()`.
  - Jobs: project key/index normalization.
  - Cache: project list cards.
- APIs:
  - `GET /api/projects`
  - `POST /api/projects`
  - `GET /api/projects/{id}`
  - `PATCH /api/projects/{id}`
  - `GET /api/projects/{id}/summary`
- Cursor scope:
  - Review: `apps/project/*` + DTO serializers only.
  - Skip: sprint/issue except imported interfaces.

### Module: `permissions`
- Responsibility: centralized authorization for all modules.
- Does NOT own: business logic, entity persistence, or view-level role checks.
- Screens: all protected screens (indirect).
- Dependencies: foundation, auth/user, project (for membership resolution).
- Backend requirements:
  - Models: none (reads role/membership data via contracts).
  - Services: `PermissionService` with methods such as:
    - `can_view_project()`, `can_edit_project()`
    - `can_manage_members()`, `can_edit_issue()`, `can_transition_issue()`
    - `can_complete_sprint()`, `can_start_sprint()`, `can_comment_on_issue()`
    - `can_edit_issue_field(issue, field_name)`
  - Permissions: DRF permission classes delegate here — **no `if role == "admin"` in views/services**.
  - Jobs: optional role/membership cache warm-up.
  - Cache: resolved role context per user+project.
- APIs: none (internal service only; consumed by all modules).
- Cursor scope:
  - Review: `apps/permissions/*`, `apps/contracts/project_contract.py`, `apps/contracts/permission_contract.py`.
  - Skip: issue/workflow/board implementation internals.

### Module: `project_settings_members`
- Responsibility: membership and roles.
- Does NOT own: auth credentials or authorization decisions (delegates to `PermissionService`).
- Screens: settings members.
- Dependencies: project, user, auth, permissions.
- Backend requirements:
  - Models: ProjectInvite, RoleAssignment (or fields on ProjectMember).
  - Services: invite, role update, remove member.
  - Permissions: `PermissionService.can_manage_members()` — no inline role checks.
  - Jobs: invitation email sender.
  - Cache: member list short cache.
- APIs:
  - `GET /api/projects/{id}/members`
  - `POST /api/projects/{id}/members/invite`
  - `PATCH /api/projects/{id}/members/{memberId}`
  - `DELETE /api/projects/{id}/members/{memberId}`
- Cursor scope:
  - Review: `apps/project_settings_members/*`, `apps/project/models.py` membership relation.
  - Skip: issue/workflow apps.

### Module: `workflow`
- Responsibility: configurable statuses, transition rules, and **centralized transition execution**.
- Does NOT own: issue persistence, board projection, or view-level authorization.
- Screens: settings statuses, board columns, status badges; consumed by all transition surfaces (board, my tasks, issue detail, backlog).
- Dependencies: project, permissions.
- Backend requirements:
  - Models: WorkflowScheme, WorkflowStatus, WorkflowTransition.
  - Services:
    - `WorkflowConfigService` — status/transition CRUD, column ordering.
    - **`TransitionService`** — single entry point for issue status changes:
      - validates transition against workflow rules,
      - checks `PermissionService.can_transition_issue()`,
      - applies status change via issue contract,
      - emits domain events (activity/notification).
  - Permissions: `PermissionService.can_manage_workflow()` for config; `can_transition_issue()` for execution.
  - Jobs: transition rule cache invalidation.
  - Cache: workflow config by project.
- APIs:
  - `GET /api/projects/{id}/workflow`
  - `PUT /api/projects/{id}/workflow`
  - *(no public transition endpoint here — transitions are invoked via `issue` API, which delegates to `TransitionService`)*
- Cursor scope:
  - Review: `apps/workflow/*`, `apps/contracts/workflow_contract.py`, `apps/contracts/issue_contract.py`.
  - Skip: board/mytasks views, issue_detail internals.

### Module: `label`
- Responsibility: label catalog for issues.
- Does NOT own: issue-label relation business rules beyond assignment constraints.
- Screens: settings labels, create issue label selection.
- Dependencies: project.
- Backend requirements:
  - Models: Label.
  - Services: CRUD, archive.
  - Permissions: `PermissionService.can_view_project()` / `can_manage_labels()`.
  - Jobs: label usage counter recompute.
  - Cache: label list per project.
- APIs:
  - `GET /api/projects/{id}/labels`
  - `POST /api/projects/{id}/labels`
  - `PATCH /api/projects/{id}/labels/{labelId}`
  - `DELETE /api/projects/{id}/labels/{labelId}`
- Cursor scope:
  - Review: `apps/label/*`.
  - Skip: issue detail/comments attachments.

### Module: `sprint`
- Responsibility: sprint CRUD + lifecycle transitions (planned/active/paused/completed/cancelled).
- Does NOT own: issue content; only sprint membership and transition side-effects invocation.
- Screens: project sprints, sprint detail, workspace sprints, complete sprint modal.
- Dependencies: project, issue (for counts and reassignment), workflow(optional guards).
- Backend requirements:
  - Models: Sprint, SprintMetricSnapshot.
  - Services: start/pause/resume/complete rules, completion move policy.
  - Permissions: `PermissionService.can_view_sprint()` / `can_start_sprint()` / `can_complete_sprint()`.
  - Jobs: days-remaining recomputation, burndown snapshots.
  - Cache: active sprint per project.
- APIs:
  - `GET /api/projects/{id}/sprints`
  - `POST /api/projects/{id}/sprints`
  - `GET /api/projects/{id}/sprints/{sprintId}`
  - `PATCH /api/projects/{id}/sprints/{sprintId}`
  - `POST /api/projects/{id}/sprints/{sprintId}/start`
  - `POST /api/projects/{id}/sprints/{sprintId}/pause`
  - `POST /api/projects/{id}/sprints/{sprintId}/complete`
  - `GET /api/workspace/sprints`
- Cursor scope:
  - Review: `apps/sprint/*`, contract interfaces from `apps/issue/services/sprint_link.py`.
  - Skip: notification/search internals.

### Module: `issue`
- Responsibility: issue CRUD, assignment, sprint linkage, base filters, and **the single transition API surface**.
- Does NOT own: workflow rule definitions (`workflow`), board projection (`board`), comments/history/watchers/subtasks (`issue_detail` submodules).
- Screens: backlog, sprint planning, create issue drawer, sprint list, my tasks queries, sprint board (via transition), issue detail status changes.
- Dependencies: project, sprint, label, workflow (`TransitionService`), permissions, user.
- Backend requirements:
  - Models: Issue, IssueAssignment, IssueLabel.
  - Services:
    - `IssueService` — create/update, assign sprint, bulk move, key generation.
    - `IssueTransitionFacade` — thin API layer that delegates to `workflow.TransitionService`.
  - Permissions: `PermissionService.can_view_issue()` / `can_edit_issue()` / `can_transition_issue()`.
  - Jobs: reindex for search.
  - Cache: common filtered issue lists.
- APIs:
  - `GET /api/issues` (scoped by project/sprint/assignee/status/priority/search)
  - `POST /api/issues`
  - `GET /api/issues/{issueId}`
  - `PATCH /api/issues/{issueId}`
  - **`POST /api/issues/{issueId}/transition`** — **single transition endpoint for all surfaces** (board, my tasks, issue detail, backlog)
  - `POST /api/issues/{issueId}/assign-sprint`
  - `POST /api/issues/bulk/assign-sprint`
- Cursor scope:
  - Review: `apps/issue/*`, `apps/contracts/issue_contract.py`, `apps/contracts/workflow_contract.py`.
  - Skip: `apps/board`, `apps/notification`, `apps/dashboard`, `apps/search`.

### Module: `board`
- Responsibility: **read-only** sprint board projection and aggregation.
- Does NOT own: transition logic, workflow rules, or issue mutation. Drag-drop on the frontend calls `POST /api/issues/{id}/transition`.
- Screens: sprint board, advanced board (future richer filters).
- Dependencies: issue (read contracts), workflow (column config contract), sprint, permissions.
- Backend requirements:
  - Models: none required (projection only) or BoardViewPreference.
  - Services: `BoardProjectionService` — assembles columns + grouped issue cards from selectors.
  - Selectors: read-only queries against issue/workflow data via contracts.
  - Permissions: `PermissionService.can_view_sprint()`.
  - Jobs: none.
  - Cache: board payload by sprint+filter.
- APIs:
  - `GET /api/projects/{id}/sprints/{sprintId}/board` — **read-only projection**
  - ~~`POST /api/projects/{id}/sprints/{sprintId}/board/move`~~ — **removed; use `POST /api/issues/{id}/transition`**
- Cursor scope:
  - Review: `apps/board/*`, `apps/contracts/issue_contract.py`, `apps/contracts/workflow_contract.py`.
  - Skip: `apps/workflow/services/transition_service.py`, issue_detail, notification.

### Module: `mytasks`
- Responsibility: personalized issue views and filter presets (assigned/created/watching).
- Does NOT own: transition logic — frontend calls `POST /api/issues/{id}/transition` directly.
- Screens: my tasks.
- Dependencies: issue (read contracts), workflow (column config), permissions.
- Backend requirements:
  - Models: none (query facade), optional UserTaskPreference.
  - Services: personalized list/board grouping and sorting (selectors only).
  - Permissions: `PermissionService.can_view_issue()` per result.
  - Jobs: optional denormalized user task counters.
  - Cache: per-user filter results short TTL.
- APIs:
  - `GET /api/me/tasks`
  - `GET /api/me/tasks/board`
  - ~~`POST /api/me/tasks/{issueId}/transition`~~ — **removed; use `POST /api/issues/{id}/transition`**
- Cursor scope:
  - Review: `apps/mytasks/*`, `apps/contracts/issue_contract.py`.
  - Skip: workflow TransitionService, project settings, notifications.

### Module: `issue_detail` (facade)
- Responsibility: unified API surface for deep issue collaboration; delegates to bounded submodules.
- Does NOT own: base issue identity/status transitions (issue + workflow own those).
- Screens: issue detail and enhanced issue drawers.
- Dependencies: issue, user, project, permissions, notification (via events).
- Internal submodules (each independently buildable/testable):

| Submodule | Owns | Models |
|-----------|------|--------|
| `issue_collaboration/` | comments, mentions, watchers | IssueComment, IssueWatcher |
| `issue_attachment/` | file upload/download | Attachment |
| `issue_relationship/` | subtasks, linked issues | IssueSubtask, IssueLink |
| `issue_history/` | field change audit trail | IssueHistory |

- Backend requirements:
  - Services: thin facade routes to submodule services; each submodule owns its write logic.
  - Permissions: `PermissionService.can_comment_on_issue()`, `can_edit_issue_field()`, etc.
  - Jobs: mention detection (collaboration), attachment processing (attachment), history compaction (history).
  - Cache: issue timeline pages.
- APIs (unified under `issue_detail` router, implemented by submodules):
  - `GET /api/issues/{id}/detail`
  - `GET|POST|PATCH /api/issues/{id}/comments` → `issue_collaboration`
  - `POST|DELETE /api/issues/{id}/watchers` → `issue_collaboration`
  - `GET|POST /api/issues/{id}/attachments` → `issue_attachment`
  - `GET|POST|PATCH /api/issues/{id}/subtasks` → `issue_relationship`
  - `POST|DELETE /api/issues/{id}/links` → `issue_relationship`
  - `GET /api/issues/{id}/history` → `issue_history`
- Cursor scope (work one submodule at a time):
  - Review: `apps/issue_detail/<submodule>/*`, `apps/contracts/issue_contract.py`.
  - Skip: other submodules, sprint/board/workflow internals.

### Module: `activity`
- Responsibility: event stream for sprint/project/workspace activity feeds.
- Does NOT own: source domain logic; only event persistence/query.
- Screens: dashboard activity feed, sprint activity page, issue history.
- Dependencies: all producing modules.
- Backend requirements:
  - Models: ActivityEvent.
  - Services: append/query by scope.
  - Permissions: scope-level visibility checks.
  - Jobs: event compaction/retention.
  - Cache: recent activity windows.
- APIs:
  - `GET /api/activity/workspace`
  - `GET /api/projects/{id}/activity`
  - `GET /api/projects/{id}/sprints/{sprintId}/activity`
- Cursor scope:
  - Review: `apps/activity/*` only.
  - Skip: producers' internals.

### Module: `notification`
- Responsibility: notification inbox and unread state.
- Does NOT own: event triggering rules (consumes emitted domain events).
- Screens: notification bell/dropdown/center.
- Dependencies: activity or event bus + issue_detail mentions.
- Backend requirements:
  - Models: Notification, NotificationPreference, NotificationReceipt.
  - Services: fanout, read/unread transitions.
  - Permissions: recipient-only.
  - Jobs: async fanout + digest email.
  - Cache: unread counters.
- APIs:
  - `GET /api/notifications`
  - `POST /api/notifications/{id}/read`
  - `POST /api/notifications/read-all`
  - `GET /api/notifications/unread-count`
  - `GET /api/notifications/preferences`
  - `PUT /api/notifications/preferences`
- Cursor scope:
  - Review: `apps/notification/*`, event contract files.
  - Skip: project/sprint model files.

### Module: `search`
- Responsibility: unified search API across issue/project/user.
- Does NOT own: source data mutation.
- Screens: global search overlay.
- Dependencies: issue, project, user, optional pg_trgm or OpenSearch.
- Backend requirements:
  - Models: SearchIndex(optional) or native DB search only.
  - Services: federated search aggregator.
  - Permissions: scope-filtered results.
  - Jobs: async indexing from domain events.
  - Cache: hot query terms.
- APIs:
  - `GET /api/search?q=...&types=issue,project,user`
- Cursor scope:
  - Review: `apps/search/*`, read models/contracts only.
  - Skip: feature app internals.

### Module: `dashboard`
- Responsibility: KPI endpoints powering dashboard cards.
- Does NOT own: raw event/entity management.
- Screens: dashboard metrics cards.
- Dependencies: workspace, project, sprint, issue, activity.
- Backend requirements:
  - Models: optional materialized snapshots.
  - Services: KPI calculators.
  - Permissions: workspace membership.
  - Jobs: periodic materialization.
  - Cache: dashboard payload.
- APIs:
  - `GET /api/dashboard/summary`
- Cursor scope:
  - Review: `apps/dashboard/*`, contracts from other modules.
  - Skip: direct domain write code.

### Module: `integrations` (future-ready)
- Responsibility: project integration configs and webhook handling.
- Does NOT own: issue/project core state.
- Screens: settings integrations.
- Dependencies: project, auth.
- APIs:
  - `GET /api/projects/{id}/integrations`
  - `POST /api/projects/{id}/integrations`
  - `PATCH /api/projects/{id}/integrations/{integrationId}`
  - `DELETE /api/projects/{id}/integrations/{integrationId}`

---

## 4) Module Dependency Graph

```text
foundation
  └── contracts/          ← shared DTOs/interfaces (no business logic)
  └── auth
      └── permissions     ← consumed by ALL modules below
          └── project
              ├── project_settings_members
              ├── label
              ├── sprint
              ├── workflow
              │   └── TransitionService  ← single transition authority
              ├── issue
              │   └── POST /issues/{id}/transition → TransitionService
              ├── board (read-only projection)
              ├── mytasks (read-only facade)
              ├── issue_detail (facade)
              │   ├── issue_collaboration/
              │   ├── issue_attachment/
              │   ├── issue_relationship/
              │   └── issue_history/
              ├── activity
              │   ├── notification
              │   └── dashboard
              ├── search
              └── workspace (aggregates project/sprint/issue/activity)
```

Rules:
- No cyclic dependencies.
- Cross-module access **only** through `apps/contracts/` — never import another module's models or services directly.
- `permissions.PermissionService` is the sole authorization authority.
- `workflow.TransitionService` is the sole issue transition authority.
- `board` and `mytasks` are read-only; they never mutate issues.

---

## 5) Phase-Wise Roadmap

> **Revised order:** Core entities before orchestration. Transitions before board/mytasks. Issue detail submodules after issue core is stable.

### Phase 0 — Foundation
- Django, DRF, PostgreSQL, Redis, Celery, JWT, base settings.
- `apps/contracts/` scaffold with empty contract stubs.
- `ARCHITECTURE_RULES.md`, base error schema, pagination, health check, OpenAPI.
- Unlock: deployable skeleton.

### Phase 1 — Auth
- Register/login/refresh/logout/password reset.
- Unlock: login/signup/forgot-password.

### Phase 2 — Project
- Project CRUD, key constraints, summary endpoint.
- Unlock: projects list, create project, project shell header.

### Phase 3 — Members + Permissions
- `project_settings_members` + **`permissions.PermissionService`** with project/workspace role resolution.
- Unlock: settings members; all future modules have authorization foundation.

### Phase 4 — Labels
- Label CRUD + archive.
- Unlock: settings labels, create issue label picker.

### Phase 5 — Sprint
- Sprint CRUD + start/pause/resume/complete lifecycle.
- Unlock: project sprints, sprint detail, workspace sprints, sprint planning targets.

### Phase 6 — Workflow
- Workflow config (statuses, transitions, column ordering).
- `TransitionService` scaffold (validation only; no issue mutation yet).
- Unlock: settings statuses, dynamic board column definitions.

### Phase 7 — Issue Core
- Issue CRUD, sprint assignment/bulk move, filtering, key generation.
- Unlock: backlog, sprint planning, create issue drawer, sprint list.

### Phase 8 — Issue Transitions
- Wire `POST /api/issues/{id}/transition` → `TransitionService` → issue status update + event emission.
- Unlock: status changes from any surface (board, my tasks, issue detail, backlog).

### Phase 9 — Board + My Tasks
- `board` read-only projection endpoint; `mytasks` read-only personalized queries.
- Both consume issue/workflow contracts; transitions already work via Phase 8.
- Unlock: sprint board drag-and-drop, my tasks list/board views.

### Phase 10 — Issue Detail (submodules, one per sub-phase)
- 10a: `issue_collaboration` (comments, mentions, watchers)
- 10b: `issue_attachment` (upload/download)
- 10c: `issue_relationship` (subtasks, links)
- 10d: `issue_history` (audit trail)
- Unlock: issue detail and enhanced drawer interactions.

### Phase 11 — Activity
- Event store + scoped activity feeds.
- Unlock: sprint activity page, project/workspace activity feeds.

### Phase 12 — Notifications
- Notification fanout from domain events, inbox, read/unread, preferences.
- Unlock: notification bell, notification center.

### Phase 13 — Dashboard
- KPI aggregation endpoints.
- Unlock: dashboard metric cards.

### Phase 14 — Search
- Unified search across issues/projects/users.
- Unlock: global search overlay.

### Phase 15 — Integrations / QA / Releases / Ops (future)
- Extend for placeholder frontend modules without refactoring core.

---

## 6) Recommended Folder Structure (AI-Friendly)

```text
backend/
  config/
    settings/
    urls.py
    celery.py
  apps/
    foundation/
    contracts/              ← shared DTOs/interfaces (cross-module boundary)
      issue_contract.py
      sprint_contract.py
      workflow_contract.py
      project_contract.py
      permission_contract.py
      activity_contract.py
    auth/
    permissions/            ← PermissionService (centralized authorization)
    workspace/
    project/
    project_settings_members/
    workflow/
      services/
        transition_service.py   ← single transition authority
    label/
    sprint/
    issue/
    board/                  ← read-only projection
    mytasks/                ← read-only facade
    issue_detail/           ← facade router
      collaboration/        ← comments, mentions, watchers
      attachment/
      relationship/         ← subtasks, links
      history/
    activity/
    notification/
    search/
    dashboard/
    integrations/
  ARCHITECTURE_RULES.md
  tests/
    contract/
    integration/
    architecture/           ← import-boundary enforcement tests
```

Inside each app:

```text
apps/<module>/
  models.py
  services/
  selectors.py          ← read-only queries
  api/
    serializers.py
    views.py            ← thin; no business logic
    urls.py
  tasks.py
  README.md
  API_CONTRACT.md
  DEPENDENCIES.md
  TASKS.md
```

Why this minimizes Cursor token usage:
- Single-module prompts target one folder.
- `apps/contracts/` is the **only** cross-module import surface — no reading other modules' internals.
- `permissions/` eliminates duplicated auth logic across modules.
- `board` and `mytasks` are small read-only apps with no transition code to review.
- `issue_detail` submodules are independently buildable without loading the whole detail domain.

---

## 7) Cursor Development Strategy

- One prompt = one module (or one `issue_detail` submodule) + one objective.
- Always include:
  - module folder,
  - its `README.md` + `DEPENDENCIES.md`,
  - relevant files from `apps/contracts/` only (never dependency module internals),
  - `ARCHITECTURE_RULES.md` for new modules.
- Never load whole `apps/`.
- Transition work: review `apps/workflow/services/transition_service.py` + `apps/issue/api/` — never board/mytasks.
- Permission work: review `apps/permissions/` only — never scatter checks into feature modules.
- Keep each PR phase/module-scoped.
- Add/maintain `tests/contract/<module>_api_test.py`, `tests/integration/<module>_flow_test.py`, `tests/architecture/test_import_boundaries.py`.

Prompt template:
- Goal
- In-scope files
- Out-of-scope files
- Contracts consumed (from `apps/contracts/`)
- Expected API behavior
- Permission checks required (via `PermissionService` methods)
- Test cases required

---

## 8) Refactoring Prevention Strategy

- Define immutable IDs and key formats early (`DF-123`).
- Freeze `apps/contracts/` stubs before implementing each phase.
- **Single transition path:** `POST /api/issues/{id}/transition` → `TransitionService` — never add alternate transition endpoints.
- **Single permission path:** `PermissionService` — never add inline role checks.
- **Board/mytasks stay read-only** — if mutation logic appears there, it is a violation.
- Emit domain events from write services; `activity`/`notification`/`search` subscribe asynchronously.
- Architecture tests (`tests/architecture/`):
  - disallow direct cross-module model/service imports (only `apps/contracts/` allowed),
  - enforce no cyclic dependencies,
  - enforce no `if role ==` patterns in views/services (lint rule).
- Use additive schema evolution; avoid table rewrites mid-phases.
- Keep query-specific read models in selectors to prevent bloating core models.
- See `ARCHITECTURE_RULES.md` for the full rule set.

---

## 9) Risks

### Modularity failure risks
- `issue_detail` submodules merging back into a monolith if facade is bypassed.
- `TransitionService` logic leaking into `issue` views instead of staying in `workflow`.
- `PermissionService` bypassed with ad-hoc role checks in new features.

### Likely refactor hotspots
- Sprint completion behavior (remaining issue move rules).
- Workflow transition constraints as statuses become configurable.
- Search backend choice (Postgres full-text vs dedicated engine) at scale.

### Dependency risks
- `permissions` becomes a god-module if it imports too many domain models — mitigate via contracts.
- Notification depends on reliable event emission from `TransitionService` and issue_detail submodules.
- Dashboard KPIs can cause heavy joins unless materialized/cached.

### Cursor token/context explosion risks
- Reading `issue`, `issue_detail/*`, `workflow`, `permissions` together.
- Importing module internals instead of `apps/contracts/`.
- Building all four `issue_detail` submodules in one prompt.

Mitigations:
- `apps/contracts/` as sole cross-module boundary,
- `ARCHITECTURE_RULES.md` + import-boundary tests,
- one submodule per Cursor prompt for issue_detail,
- board/mytasks are small read-only modules with minimal context needs.

