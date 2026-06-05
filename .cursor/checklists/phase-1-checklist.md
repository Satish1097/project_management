# Phase 1 Checklist — Auth + Identity

Use this checklist for **every Phase 1 PR** and before marking Phase 1 complete.

**Freeze authority:** `.cursor/freeze/phase-1-freeze.md`

---

## Architecture

- [ ] No architecture drift from `phase-1-freeze.md`
- [ ] `apps/accounts` app only
- [ ] No `apps/auth/` or `apps/identity/` apps
- [ ] Service → Selector → API layering followed
- [ ] Thin views only
- [ ] Services own writes
- [ ] Selectors are read-only
- [ ] Contracts-only cross-module imports (`apps/contracts/`, `apps/foundation/`)
- [ ] `apps/contracts/identity_contract.py` present and used

---

## Authentication

- [ ] Custom User model with UUID PK
- [ ] Email-only authentication — no username field
- [ ] JWT via `simplejwt`
- [ ] Access token lifetime: 15 minutes
- [ ] Refresh token lifetime: 7 days (default)
- [ ] Remember me refresh: 30 days
- [ ] No session auth introduced

---

## Registration

- [ ] Invite-only registration
- [ ] No public signup (register requires valid invite token)
- [ ] No email verification
- [ ] No OTP
- [ ] No confirm-email flow
- [ ] Email comes from invitation only (register payload: `invite_token`, `name`, `password` — no client email)
- [ ] No role on invitation (`UserInvitation` has no role, org, workspace, or permission fields)

---

## Scope

- [ ] Auth-only scope maintained
- [ ] Users become globally available after registration
- [ ] No organization creation or membership implementation
- [ ] No project membership implementation
- [ ] No role assignment (on user or invitation)
- [ ] No global user roles
- [ ] No `PermissionService` / RBAC
- [ ] No Google / Microsoft / Apple auth
- [ ] No invite management UI or API
- [ ] No avatar upload pipeline
- [ ] No user email change API
- [ ] No `UserPreference` API

---

## Models

- [ ] Only Phase 1 models: User, UserProfile, UserPreference, UserInvitation, UserManager
- [ ] `UserInvitation` fields match freeze (`email`, `token`, `invited_by`, `expires_at`, `is_used`, `used_at`, `metadata`)
- [ ] No SSO / social auth models added

---

## API surface

- [ ] Public endpoints only as frozen: register, login, refresh, password/forgot, password/reset
- [ ] Authenticated endpoints only as frozen: logout, GET `/api/me`, PATCH `/api/me`
- [ ] Foundation response envelope used (`success`, `message`, `data` / `errors`)
- [ ] No out-of-scope endpoints added

---

## JWT

- [ ] JWT refresh rotation enabled
- [ ] Token blacklist after rotation enabled

---

## Validation

- [ ] Tests updated for changed behavior
- [ ] Architecture tests pass (`tests/architecture/`)
- [ ] Implementation follows frozen slice order (1–6) — no skipped or reordered dependencies

---

## Sign-off

| Field | Value |
|-------|-------|
| Slice | |
| PR / session | |
| Reviewer | |
| Date | |
