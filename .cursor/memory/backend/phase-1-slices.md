# Phase 1 — Implementation Slices

Status: **planning** — implement one slice per PR/session.

---

## Slice 1 — Foundation Infrastructure

**Goal:** Runnable API skeleton with conventions; no domain business logic.

### In scope

- `requirements.txt`: DRF, simplejwt, corsheaders
- `AUTH_USER_MODEL` placeholder readiness (User model in Slice 2, but settings prepared)
- `apps.common`: `TimeStampedModel`, UUID primary key mixin
- `apps.common.responses`: standard envelope (`success`, `data`, `error`)
- `core/settings.py`: `REST_FRAMEWORK`, JWT settings, `CORS`, `AUTH_USER_MODEL` path
- `core/urls.py`: `/api/v1/` include stub
- Health check: `GET /api/v1/health/` (optional, unauthenticated)

### Out of scope

- User, Organization, Project models
- Auth endpoints
- Permissions beyond `AllowAny` on health

### Files (expected)

```txt
backend/requirements.txt
backend/core/settings.py
backend/core/urls.py
backend/apps/common/models.py
backend/apps/common/responses.py
backend/apps/common/tests/test_responses.py
```

### Validation

- `manage.py check` passes
- Envelope helper unit tests pass
- Migrations: common app only if abstract bases need no tables (or empty initial)

---

## Slice 2 — Authentication

**Goal:** Register, login, refresh, logout, me — JWT only.

### Frontend drivers

- `LoginPage`, `SignupPage`, `ForgotPasswordPage` (reset = stub OK)
- `AuthProvider`, `ProtectedRoute`

### Schema (this slice only)

- `accounts.User`: id (UUID), email (unique), password, name, avatar_color, is_active

### API contract

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/auth/register/` | `{ name, email, password }` → user + tokens (no workspace yet OR defer workspace to Slice 3 — **choose at slice start**) |
| POST | `/api/v1/auth/login/` | `{ email, password }` |
| POST | `/api/v1/auth/refresh/` | `{ refresh }` |
| POST | `/api/v1/auth/logout/` | blacklist refresh if enabled |
| GET | `/api/v1/auth/me/` | `{ user }` |

**Decision at slice 2 kickoff:** Register creates user only vs user+workspace. **Recommended:** user only in Slice 2; Slice 3 adds workspace on first `GET /workspaces/` empty or explicit create. **Alternative:** register transaction creates default workspace (Slice 2 touches Organization) — slightly wider slice.

Recommended minimal path: **Slice 2 = user + JWT only**; signup workspace creation in **Slice 3**.

### Permissions

- Public: register, login, refresh
- Authenticated: me, logout

### Files (expected)

```txt
backend/apps/accounts/models.py
backend/apps/accounts/serializers.py
backend/apps/accounts/services.py
backend/apps/accounts/views.py
backend/apps/accounts/urls.py
backend/apps/accounts/tests/
```

### Validation

- Tests: register, login, invalid creds, me with/without token, refresh rotation

---

## Slice 3 — Workspace

**Goal:** Organization as workspace; membership; API uses `workspace` key.

### Frontend drivers

- Signup → empty workspace journey
- `X-Workspace-Id` for scoped routes (document for frontend)
- Workspace members (picker data) — list users in workspace

### Schema

- `organizations.Organization`: id, name, slug
- `organizations.OrganizationMember`: organization, user, role (`owner`|`admin`|`member`)

### Services

- `create_workspace_for_user` (signup hook or POST workspace)
- `register_user` may move here from accounts if deferred from Slice 2

### API contract

| Method | Path | Response keys |
|--------|------|----------------|
| GET | `/api/v1/workspaces/` | `{ workspaces: [...] }` |
| GET | `/api/v1/workspaces/{id}/` | `{ workspace }` |
| PATCH | `/api/v1/workspaces/{id}/` | `{ workspace }` |
| GET | `/api/v1/workspaces/{id}/members/` | paginated `members` |
| POST | `/api/v1/workspaces/{id}/members/` | add by email (existing user only, MVP) |

Workspace permission map: `WORKSPACE_ROLE_PERMISSIONS` (mirror project pattern).

### Permissions (Slice 3)

| Permission | owner | admin | member |
|------------|:-----:|:-----:|:------:|
| view_workspace | ✓ | ✓ | ✓ |
| edit_workspace | ✓ | ✓ | |
| manage_workspace_members | ✓ | ✓ | |

### Files (expected)

```txt
backend/apps/organizations/models.py
backend/apps/organizations/permission_codes.py
backend/apps/organizations/selectors.py
backend/apps/organizations/services.py
backend/apps/organizations/serializers.py
backend/apps/organizations/views.py
backend/apps/organizations/permissions.py
backend/apps/organizations/urls.py
backend/apps/organizations/tests/
```

Wire: `POST /auth/register/` → user + default workspace + owner membership (if not done in Slice 2).

### Validation

- Tests: create workspace, list for member only, 403 cross-workspace, role gates on PATCH/members

---

## Slice 4 — Projects

**Goal:** Project CRUD + project membership with four roles.

### Frontend drivers

- `ProjectsListPage`, `CreateProjectDrawer`
- `ProjectSettingsGeneralPage`, `ProjectSettingsMembersPage`

### Schema

- `projects.Project`: organization FK, key, name, description, status, lead, icon, visibility, methodology, project_type, default_sprint_weeks, issue_counter (0)
- `projects.ProjectMember`: project, user, role (`admin`|`developer`|`qa`|`member`)

### API contract

| Method | Path |
|--------|------|
| GET/POST | `/api/v1/projects/` |
| GET/PATCH/DELETE | `/api/v1/projects/{id}/` |
| GET/POST/PATCH/DELETE | `/api/v1/projects/{id}/members/` |

Requires header `X-Workspace-Id`. List filtered by workspace membership.

Response uses `project` / `projects`, never `organization`.

### Permissions (Slice 4 — Phase 1 matrix)

See `permissions.md` — only `view_project`, `edit_project`, `manage_members`, `archive_project`.

### Files (expected)

```txt
backend/apps/projects/models.py
backend/apps/projects/permission_codes.py
backend/apps/projects/selectors.py
backend/apps/projects/services.py
backend/apps/projects/serializers.py
backend/apps/projects/views.py
backend/apps/projects/permissions.py
backend/apps/projects/urls.py
backend/apps/projects/tests/
```

### Validation

- Tests: key uniqueness per workspace, creator = admin, role enforcement on PATCH/settings/members, queryset isolation

---

## After Phase 1

Do not start Phase 2 until all four slices are merged, tested, and frontend integration is planned slice-by-slice (separate track: `frontend → API client` per feature).
