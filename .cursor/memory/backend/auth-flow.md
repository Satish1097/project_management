# Auth Flow (Target + Current)

## Current frontend (mock)

- `AuthProvider` stores boolean in localStorage (`authStorage.ts`)
- `ProtectedRoute` blocks app routes; `GuestRoute` for login/signup
- No JWT/cookies yet — login() sets session true

## Target backend auth (frozen)

**JWT only** — `djangorestframework-simplejwt`. No session auth unless explicitly changed.

1. **Login** — `POST /api/v1/auth/login/` → `{ access, refresh }`
2. **Refresh** — `POST /api/v1/auth/refresh/`
3. **Logout** — invalidate/blacklist refresh
4. **Me** — `GET /api/v1/auth/me/` → `{ user, workspaces? }` (workspaces after Slice 3)

See `phase-execution.md` for slice boundaries.

## User model

- Extend `AbstractUser` or custom user in `apps.accounts`
- Profile fields: `name`, `avatar_color`, `email` (unique)

## Workspace scoping

- Every API request resolves **current organization** from:
  - Header `X-Workspace-Id`, or
  - User's default workspace, or
  - Subdomain (future)
- All project/issue queries **filter by workspace** — never trust client `project_id` alone

## Frontend integration (planned)

- Store tokens in httpOnly cookie or secure memory — avoid localStorage for refresh tokens if possible
- Axios/fetch interceptor adds `Authorization: Bearer`
- On 401 → redirect to `/login`

## Password reset

- Route exists: `/forgot-password` — wire to email token endpoint when backend ready

## Signup

- Creates user + default workspace (organization) — transaction in `services.register_user`
