# Phase 1 Freeze — Auth + Identity

**Status:** LOCKED  
**Effective:** Phase 1 start → Phase 1 complete  
**Authority:** Single source of truth for Phase 1 decisions. Treat as immutable unless explicitly approved.

> Do not change architecture, scope, or API contracts during Phase 1 implementation without explicit approval and an update to this file.

**Related documents (subordinate to this freeze):**

- `.cursor/plans/phase-1-auth-identity.md` — detailed planning reference
- `.cursor/plans/ARCHITECTURE_RULES.md` — global backend rules (must comply)
- `.cursor/checklists/phase-1-checklist.md` — per-PR enforcement checklist

---

## Architecture

| Decision | Locked value |
|----------|--------------|
| App module | **`apps/accounts` only** |
| Forbidden apps | **No `apps/auth/`** · **No `apps/identity/`** |
| Layering | **Service → Selector → API** (writes in services, reads in selectors, HTTP in API) |
| Views | **Thin views only** (≤15 logic lines per method; delegate to services/selectors) |
| Cross-module boundary | **`apps/contracts/identity_contract.py` required** |
| Imports | **No direct cross-module imports** outside `apps/contracts/`, `apps/foundation/`, `apps/permissions/` (permissions unused in Phase 1) |

Internal `apps/accounts/` layout (locked):

```text
models/     user.py, profile.py, preference.py, invitation.py
services/   auth_service, password_service, profile_service, invitation_service
selectors.py
api/        serializers.py, views.py, urls.py
managers.py
```

---

## Authentication

| Decision | Locked value |
|----------|--------------|
| User model | **Custom User model** (`accounts.User`) |
| Primary key | **UUID** |
| Login identifier | **Email only** |
| Username field | **None — no username field** |
| Token library | **JWT via `djangorestframework-simplejwt`** |
| Access token lifetime | **15 minutes** |
| Refresh token lifetime (default) | **7 days** |
| Refresh token lifetime (remember me) | **30 days** |
| Refresh rotation | **Enabled** |
| Blacklist after rotation | **Enabled** |
| Session auth | **Not used** |

`AUTH_USER_MODEL = "accounts.User"` must be set before first accounts migration.

---

## Registration

| Decision | Locked value |
|----------|--------------|
| Mode | **Invite-only registration** |
| Public signup | **Not allowed** |
| Email verification | **Not required** |
| OTP | **Not used** |
| Confirm-email flow | **Not used** |

> Registration authorization happens through invitation, not email verification.

**Locked registration request contract:**

```json
{
  "invite_token": "secure-token",
  "name": "John Doe",
  "password": "StrongPassword123"
}
```

| Rule | Locked |
|------|--------|
| Email source | **Invitation record only** — client must not supply or control email |
| Invite validation | Exists · not expired · not already used |
| Post-register | Mark invitation used · issue JWT tokens |
| Invite creation API | **Out of scope** — seed via admin, management command, or test fixtures |

**Register error codes (locked):**

- `400` — invalid invitation
- `400` — expired invitation
- `400` — invitation already used
- `409` — account already exists for invite email

---

## Onboarding

**Phase 1 is authentication-only.** Users register once and become globally available across the system. Project membership, roles, and permissions are deferred to later phases.

**Locked onboarding flow:**

```text
Super Admin
  → creates invitation
  → user registers (invite-only)
  → user becomes globally available

Later phases:
  → project created
  → users added to project
  → project-specific role assigned
```

| Concern | Phase 1 |
|---------|---------|
| Organization creation | Deferred |
| Organization membership | Deferred |
| Project membership | Deferred |
| Role assignment | Deferred |
| Invite validation + consumption | Allowed |

Invite creation APIs are **out of scope** for Phase 1 — seed invitations via admin, management command, or test fixtures.

---

## Role ownership (future — not Phase 1)

User roles are **not** global.

Users are globally available after registration. Roles will be **project-scoped** in later phases.

Example future model (planning only — do not implement in Phase 1):

```text
ProjectMember(
    user,
    project,
    role
)
```

Example future project roles: `developer`, `qa`, `project_manager`, `viewer`.

`UserInvitation` authorizes registration only. It does **not** assign roles.

---

## Models

**Only implement (locked):**

- `User`
- `UserProfile`
- `UserPreference`
- `UserInvitation`
- `UserManager`

**Locked `UserInvitation` fields:**

```text
UserInvitation
    id            UUID PK
    email
    token
    invited_by    FK(AUTH_USER_MODEL), nullable
    expires_at
    is_used
    used_at       nullable — set on successful registration
    metadata      JSONField, optional future-safe extension
```

**`UserInvitation` must NOT contain:**

- `role`
- `organization_id`
- `workspace_id`
- `permission_level`
- `access_level`

Purpose: invitation authorizes registration only. No role or scope assignment in Phase 1.

**Do not implement:**

- SSO models (`SocialAccount`, provider tokens, etc.)
- Global role models or project membership models
- Any model outside `apps/accounts` for Phase 1 auth work

`User` must not inherit `foundation.BaseModel` (circular `AUTH_USER_MODEL` FK risk).

---

## API Surface

### Public APIs (locked)

| Method | Path |
|--------|------|
| POST | `/api/auth/register` |
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/password/forgot` |
| POST | `/api/auth/password/reset` |

`POST /api/auth/register` is publicly reachable but **invite-gated** (valid token required).

### Authenticated APIs (locked)

| Method | Path |
|--------|------|
| POST | `/api/auth/logout` |
| GET | `/api/me` |
| PATCH | `/api/me` |

### Response envelope (locked)

Use `apps/foundation/responses.py` shape:

```json
{ "success": true, "message": "", "data": {} }
{ "success": false, "message": "", "errors": {} }
```

### URL prefix (locked)

`/api/` — no `/api/v1/` prefix for Phase 1 auth endpoints.

---

## Explicitly Out of Scope

The following must **not** be added during Phase 1:

- Google / Microsoft / Apple auth
- `PermissionService`
- RBAC
- Global user roles
- Organization creation
- Organization membership
- Organization self-signup
- Project membership
- Role assignment (on user or invitation)
- Avatar upload (URL field on profile is acceptable; no upload pipeline)
- User email change
- `UserPreference` API
- Invite management UI or API (create, list, resend, revoke invites)
- Session / cookie authentication
- Email verification / confirm-email / OTP
- Social auth models

Authorization (membership, roles, permissions) is **fully deferred** beyond Phase 1. Phase 1 delivers authentication and identity only.

---

## Locked Implementation Order

Implement strictly in this order. Do not skip or reorder slices.

| # | Slice | Scope |
|---|-------|-------|
| 1 | **Settings & JWT infrastructure** | `AUTH_USER_MODEL`, SimpleJWT config, `token_blacklist`, DRF auth classes, `.env.example` auth vars |
| 2 | **Models & migrations** | User, UserProfile, UserPreference, UserInvitation, UserManager; admin; migrate |
| 3 | **Contracts & selectors** | `identity_contract.py` stub; read-only selectors |
| 4 | **Services** | `auth_service`, `password_service`, `profile_service`, `invitation_service` |
| 5 | **API layer** | Serializers, thin views, `api/urls.py`, wire into `core/urls.py` |
| 6 | **Tests & hardening** | Full test matrix; architecture compliance; README endpoint table |

---

## Change Control

To modify anything in this freeze:

1. Explicit written approval required
2. Update this file with rationale and date
3. Update `.cursor/plans/phase-1-auth-identity.md` if planning detail changes
4. Re-run `.cursor/checklists/phase-1-checklist.md` before merge

**Phase 1 is complete when:** all six slices are merged, checklist passes, and auth endpoints are validated against this document.
