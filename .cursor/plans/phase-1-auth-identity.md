# Phase 1 — Auth + Identity (Planning Only)

> **PHASE 1 IS FROZEN — DO NOT CHANGE ARCHITECTURE OR SCOPE WITHOUT EXPLICIT APPROVAL**
>
> Locked decisions: [`.cursor/freeze/phase-1-freeze.md`](../freeze/phase-1-freeze.md)  
> Per-PR checklist: [`.cursor/checklists/phase-1-checklist.md`](../checklists/phase-1-checklist.md)

Status: **frozen** — implement per locked slices; scope changes require freeze update.

Analysis baseline: Phase 0 complete; `apps/accounts` is an empty scaffold; legacy domain apps have no models; `simplejwt` in `requirements.txt`; `AUTH_USER_MODEL` not yet set; `foundation` provides response envelope, exception handler, and `BaseModel`.

---

## 1. Recommended Architecture

### Decision: **Reuse `apps/accounts` directly (Option A) with internal restructure (Option B-lite)**

Do **not** create `apps/auth/` or `apps/identity/`. Expand `apps/accounts` in place.

| Approach | Verdict |
|----------|---------|
| **A — Reuse `apps/accounts` as-is** | Correct app label; matches `backend/README.md` legacy mapping |
| **B — Restructure inside, keep app name** | Recommended — adopt `models/`, `services/`, `api/` layout now while the app is empty |
| **Split into `auth/` + `identity/`** | Rejected — violates constraint; causes INSTALLED_APPS churn |

**Why this is safest**

- `accounts` is registered in `INSTALLED_APPS`, excluded from import-boundary enforcement as a legacy app, and documented as `auth + identity`.
- No existing User FKs in legacy apps (all model files are empty).
- No migrations to rewrite — only add new ones.

**Cross-module boundary (plan now, enforce later)**

Add `apps/contracts/identity_contract.py` in Phase 1 as a **stub**:

- `UserDTO` (id, email, display name, avatar, timezone)
- `get_user_by_id(user_id) -> UserDTO | None`
- `get_users_by_ids(ids) -> list[UserDTO]`

**Registration strategy: invite-only**

- Only invited users can register.
- Registration requires a valid invite token.
- Email verification is **not required**.
- The invitation itself acts as authorization and trusted email ownership proof.

> Registration authorization happens through invitation, not email verification.

Invite creation APIs are **not** Phase 1. Phase 1 only validates and consumes invitations at registration time. Invitations are seeded via admin, management command, or test fixtures.

**Onboarding & access model (locked)**

Phase 1 is **authentication-only**. Users register once and become globally available across the system.

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

**Role ownership (future — not Phase 1)**

User roles are **not** global. Users are globally available after registration. Roles will be **project-scoped** in later phases.

```text
ProjectMember(user, project, role)   # future only — do not implement
```

Example future project roles: `developer`, `qa`, `project_manager`, `viewer`.

`UserInvitation` authorizes registration only. It does **not** assign roles.

**Phase 1 authZ**

```text
Public:
- login
- refresh
- forgot/reset password
- invite-only registration

Authenticated:
- logout
- GET/PATCH /api/me
```

Clarification: `register` remains publicly accessible but requires a **valid invitation token**.

`PermissionService` is **out of scope** for Phase 1.

**URL prefix**

Align with Phase 0 (`GET /api/health`, no `/v1/`).

---

## 2. `accounts` App Structure

```text
apps/accounts/
  apps.py
  admin.py
  managers.py

  models/
    __init__.py
    user.py
    profile.py
    preference.py
    invitation.py

  services/
    auth_service.py
    password_service.py
    profile_service.py
    invitation_service.py

  selectors.py

  api/
    serializers.py
    views.py
    urls.py

  tasks.py

  tests/
    test_register.py
    test_login.py
    test_tokens.py
    test_password_reset.py
    test_me.py
```

### Ownership boundaries

| Layer | Owns | Must NOT own |
|-------|------|--------------|
| **Models** | Schema, constraints | Registration logic, token issuance |
| **Services** | Writes: user creation, invite validation/consumption, password flows, profile updates | HTTP parsing |
| **Selectors** | Reads: user lookup, invite lookup, `me` projection | Mutations |
| **API views** | Serializer bind, delegate, return envelope | Business rules |

---

## 3. Custom User Model Strategy

**`User`** — `AbstractBaseUser` + `PermissionsMixin`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `UUIDField` PK | `default=uuid.uuid4` |
| `email` | `EmailField`, unique, indexed | `USERNAME_FIELD = "email"` |
| `password` | Django password field | Via `set_password()` only |
| `is_active` | `BooleanField` | Default `True` |
| `is_staff` | `BooleanField` | Admin access |
| `is_superuser` | `BooleanField` | Bootstrap |
| `date_joined` | `DateTimeField` | `auto_now_add` |
| `last_login` | `DateTimeField` | Nullable |

Do **not** inherit `foundation.BaseModel` for User (circular FK risk).

SSO future-safety: defer `SocialAccount` model to a later phase; email remains canonical.

### Migration strategy

1. Set `AUTH_USER_MODEL = "accounts.User"` before first `accounts` migration
2. Add `rest_framework_simplejwt.token_blacklist` to `INSTALLED_APPS`
3. Run migrations (User, Profile, Preference, UserInvitation)
4. Reset dev SQLite if default `auth_user` tables exist

---

## 4. UserProfile Strategy

**`UserProfile`** — `OneToOneField(User)`

| Field | Type | Required |
|-------|------|----------|
| `first_name` | `CharField(150)` | Yes at registration (from `name`) |
| `last_name` | `CharField(150)` | Default `""` |
| `avatar` | `URLField`, nullable | Nullable |
| `timezone` | `CharField(63)`, nullable | Nullable |

---

## 5. UserPreference Strategy

Minimal placeholder — `OneToOneField(User)`, `data` JSONField default `{}`. No PATCH endpoint in Phase 1.

---

## 6. UserInvitation Model (Phase 1)

**`UserInvitation`** — required because registration is invite-gated. Authorizes registration only; no role or scope assignment.

**Approved fields:**

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

**Must NOT contain:** `role`, `organization_id`, `workspace_id`, `permission_level`, `access_level`.

Phase 1 scope: validation and consumption only. No resend, no invite management UI, no invitation CRUD APIs.

---

## 7. JWT Strategy (SimpleJWT)

Unchanged from baseline plan.

| Setting | Value |
|---------|-------|
| `ACCESS_TOKEN_LIFETIME` | 15 minutes |
| `REFRESH_TOKEN_LIFETIME` (default) | 7 days |
| `REFRESH_TOKEN_LIFETIME` (remember me) | 30 days |
| `ROTATE_REFRESH_TOKENS` | True |
| `BLACKLIST_AFTER_ROTATION` | True |
| `UPDATE_LAST_LOGIN` | True |

Remember me, logout (refresh blacklist), and refresh rotation unchanged.

---

## 8. Password Reset Strategy

Unchanged — Django `PasswordResetTokenGenerator`; no email verification dependency.

---

## 9. Services

### `invitation_service.py`

```text
validate_invitation(token) → invitation record or raise domain error
consume_invitation(token)  → mark is_used, set used_at
```

Do **not** implement: resend invite, invite management UI, invitation CRUD, role assignment.

### `auth_service.register_user(invite_token, name, password)`

```text
validate invite token
→ ensure invite exists
→ ensure not expired
→ ensure not already used
→ fetch email from invitation
→ guard: account already exists for that email → 409
→ create user (email from invite)
→ create profile
→ create preference
→ mark invitation used
→ issue JWT tokens
```

Client must **not** control email during registration. Email is sourced exclusively from the invitation record.

---

## 10. API Contracts

Envelope: `{ "success", "message", "data" }` / `{ "success", "message", "errors" }`.

### `POST /api/auth/register`

| | |
|--|--|
| **Auth** | Public, but **invite-gated** |
| **Owner** | `auth_service.register_user` + `invitation_service` |
| **Request** | `{ "invite_token": "secure-token", "name": "John Doe", "password": "..." }` |
| **Success 201** | `{ "data": { "user": { ... }, "tokens": { "access", "refresh" } } }` |
| **Errors** | `400` invalid invitation; `400` expired invitation; `400` invitation already used; `409` account already exists |

No `email` field in request. No email mismatch validation needed.

### `POST /api/auth/login`

Unchanged — `{ "email", "password", "remember_me"? }`.

### `POST /api/auth/refresh`

Unchanged.

### `POST /api/auth/logout`

Unchanged.

### `POST /api/auth/password/forgot`

Unchanged.

### `POST /api/auth/password/reset`

Unchanged.

### `GET /api/me` / `PATCH /api/me`

Unchanged.

---

## 11. Testing Plan

**Existing tests unchanged:** login, JWT refresh/logout, password reset, GET/PATCH `/api/me`.

**Registration tests (invite-aware):**

| Test | Asserts |
|------|---------|
| register with valid invite | `201`, user created with invite email, tokens returned |
| register with invalid token | `400` |
| register with expired invite | `400` |
| register with used invite | `400` |
| invite marked used after registration | `is_used=True`, `used_at` set |
| email sourced from invite (not request) | User.email matches invitation; no email in payload |

---

## 12. Risks

Baseline risks unchanged (custom user timing, JWT refresh theft, SSO retrofit, Cursor context).

**Invite-only additions:**

| Risk | Mitigation |
|------|------------|
| No invite creation API in Phase 1 | Admin + management command + test fixtures for seeding |
| Orphan invites / expiry cleanup | Future job; not Phase 1 |
| Frontend SignupPage collects email | Frontend must switch to invite-link flow (`?token=`) — backend rejects client-supplied email |

---

## 13. Implementation Order

### Slice 1 — Settings & JWT infrastructure
Unchanged.

### Slice 2 — Models & migrations
- `User`, `UserManager`, `UserProfile`, `UserPreference`, **`UserInvitation`**
- Migrations + admin (include invitation admin for seeding)
- Dev DB reset + migrate

### Slice 3 — Contracts & selectors
Unchanged (+ optional `get_invitation_by_token` selector if needed).

### Slice 4 — Services
- **`invitation_service`** (`validate_invitation`, `consume_invitation`)
- **`auth_service.register_user()`** — invite-aware (no client email)
- `password_service`, `profile_service` unchanged

### Slice 5 — API layer
Unchanged structure; register serializer accepts `invite_token` not `email`.

### Slice 6 — Tests & hardening
Add invite registration test matrix (section 11).

---

## Explicitly Out of Scope (Phase 1)

- Social auth (Google / Microsoft / Apple)
- `PermissionService`
- RBAC
- Global user roles
- Organization creation / membership / self-signup
- Project membership
- Role assignment (on user or invitation)
- Email verification / confirm-email flow
- **Registration authorization is handled through invitation. Email verification is intentionally skipped.**
- Invitation CRUD, resend invite, invite management UI
- Avatar file upload
- User email change
- `UserPreference` API
- Session/cookie auth (JWT only)

Authorization (membership, roles, permissions) is fully deferred beyond Phase 1.

---

## Key Alignment Notes

| Topic | Decision |
|-------|----------|
| App module | `apps/accounts` only |
| Phase scope | Authentication-only |
| Registration | Invite-only; token required; email from invite record |
| Post-register | User globally available; no org/project attachment |
| User PK | UUID |
| Login identifier | Email (no username) |
| Roles | Project-scoped in later phases; not on User or Invitation |
| Response format | `foundation.responses` envelope |
| Me endpoint | `/api/me` |
