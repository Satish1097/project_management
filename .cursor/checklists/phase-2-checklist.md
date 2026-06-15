# Phase 2 Checklist — Organization + Project Foundation

Use this checklist for **every Phase 2 PR** and before marking Phase 2 complete.

**Freeze authority:** `.cursor/freeze/phase-2-freeze.md`  
**Phase 1 authority (must remain intact):** `.cursor/freeze/phase-1-freeze.md`

---

## Architecture

- [ ] No architecture drift from `phase-2-freeze.md`
- [ ] Only `apps/organizations` + `apps/projects` for Phase 2 domain persistence
- [ ] No `apps/workspace/` persistence app introduced
- [ ] Service → Selector → API layering followed
- [ ] Thin views only (≤15 logic lines per method)
- [ ] Services own writes; selectors are read-only
- [ ] Contracts-only cross-module imports (`apps/contracts/`, `apps/foundation/`, `apps/permissions/`)
- [ ] No direct imports between `organizations` ↔ `projects` models/services
- [ ] No inline role checks — `PermissionService` stub/wrappers only

---

## Phase 1 Preservation

- [ ] Phase 1 auth endpoints unchanged
- [ ] `UserInvitation` unchanged — no `role`, `organization_id`, `project_id`
- [ ] Invite-only registration preserved
- [ ] Users remain globally available after registration
- [ ] No global roles on `User` model
- [ ] `is_staff` / `is_superuser` not used for product authorization

---

## Organization

- [ ] `Organization` model fields match freeze (name, slug, owner, created_by, branding, settings, is_active)
- [ ] Org creation restricted to superuser
- [ ] No workspace/org self-signup
- [ ] Organization slug globally unique; collision returns `409`
- [ ] Org creator becomes `OrganizationMember` with role `owner`

---

## Organization Membership

- [ ] **OrganizationMember model frozen** — `id`, `organization`, `user`, `role`, `joined_at`, `added_by`, `is_active`
- [ ] Org role enum locked: `owner`, `admin`, `member` only
- [ ] `UNIQUE(organization_id, user_id)` constraint
- [ ] Multi-org supported — same user may belong to multiple orgs
- [ ] One organization role per user per org
- [ ] Default add role = `member`
- [ ] **No org → project role inheritance**
- [ ] Last `owner` cannot be removed without ownership transfer
- [ ] `is_active=False` hides org access (omitted from lists; APIs return `403`)
- [ ] Org member removal soft-deactivates (`is_active=False`); row retained

---

## Project

- [ ] `Project` belongs to `Organization` (required FK)
- [ ] Project fields match freeze (key, slug, name, description, status, lead, visibility, created_by, archived_at)
- [ ] **Project.slug exists and immutable** after create
- [ ] Slug lowercase kebab-case; `UNIQUE(organization_id, slug)`
- [ ] **Project key unique per org** — `UNIQUE(organization_id, key)`
- [ ] Key pattern `^[A-Z0-9]{2,10}$`; server uppercases; key immutable after create
- [ ] Reserved keys rejected (`API`, `AUTH`, `ADMIN`, `NULL`, `TEST`, `WWW`)
- [ ] **Project status enum = `active` \| `archived` only** (`PROJECT_STATUS_CHOICES`)
- [ ] New project defaults to `active`
- [ ] Archived projects read-only and hidden from default lists
- [ ] **No hard delete** — archive only (`POST .../archive`)
- [ ] `visibility`: `private` | `organization`
- [ ] Lead must be `ProjectMember` if set
- [ ] Future route shape documented: `{organization_slug}/{project_slug}`

---

## Project Membership

- [ ] `ProjectMember` roles: `project_admin`, `project_manager`, `developer`, `qa`, `viewer`
- [ ] `UNIQUE(project, user)` constraint
- [ ] Project creator auto-assigned `project_admin`
- [ ] Same user can hold different roles on different projects
- [ ] Last `project_admin` removal/demotion guard implemented
- [ ] Private projects hidden from non-members in org project list

---

## PermissionService (stub only)

- [ ] `apps/permissions/` scaffold present
- [ ] Frozen method signatures defined (org + project + `can_manage_workflow`)
- [ ] `permission_contract.py` Protocol updated
- [ ] **No full RBAC / role-permission matrix implementation**
- [ ] DRF permission classes are thin wrappers calling `PermissionService`
- [ ] `can_manage_workflow` returns `False` (stub)

---

## Contracts

- [ ] `organization_contract.py` present with DTOs + read interfaces
- [ ] `project_contract.py` extended per freeze
- [ ] `membership_contract.py` present
- [ ] `permission_contract.py` Protocol extended
- [ ] Contract functions return DTOs only — no ORM leakage
- [ ] `identity_contract` used for user display fields in member lists

---

## API Surface

- [ ] Organization endpoints match freeze (8 routes)
- [ ] Project endpoints match freeze (9 routes)
- [ ] `GET /api/me/context` implemented
- [ ] Foundation response envelope used
- [ ] URL prefix `/api/` (no `/api/v1/`)
- [ ] Locked request shapes honored
- [ ] Error codes: `400`, `403`, `404`, `409` as specified
- [ ] No out-of-scope endpoints added

---

## Onboarding

- [ ] Users remain globally available after registration (Phase 1 preserved)
- [ ] Users can exist without organization membership
- [ ] Onboarding flow: Super Admin → create org → add users → create project → assign project roles
- [ ] Empty org list returns successfully (not 403) for authenticated user
- [ ] `bootstrap_organization` management command present and idempotent
- [ ] No org/project invitation APIs
- [ ] No user search API for membership add

---

## Scope Exclusions

- [ ] No issues, sprints, boards, Kanban, backlog
- [ ] No workflow statuses or transitions
- [ ] No notifications, activity, search, dashboard
- [ ] No invite UI or invitation CRUD
- [ ] No labels, components, favorites
- [ ] No hard delete for org or project (archive only for projects)
- [ ] No custom roles or per-user ACL
- [ ] No billing, SSO, avatar upload, email change

---

## Validation

- [ ] Tests updated for changed behavior
- [ ] Architecture tests pass (`tests/architecture/`)
- [ ] Import boundary tests pass
- [ ] Implementation follows frozen slice order (1–8)
- [ ] README endpoint table updated

---

## Sign-off

| Field | Value |
|-------|-------|
| Slice | |
| PR / session | |
| Reviewer | |
| Date | |
