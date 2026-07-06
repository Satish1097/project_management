# Phase 2 Freeze — Organization + Project Foundation

**Status:** LOCKED  
**Effective:** Phase 2 start → Phase 2 complete  
**Authority:** Single source of truth for Phase 2 decisions. Treat as immutable unless explicitly approved.

> Do not change architecture, scope, or API contracts during Phase 2 implementation without explicit approval and an update to this file.

**Prerequisites (immutable):**

- `.cursor/freeze/phase-1-freeze.md` — auth + identity decisions
- `.cursor/plans/ARCHITECTURE_RULES.md` — global backend rules

**Related documents (subordinate to this freeze):**

- `.cursor/plans/phase-2-org-project-foundation.md` — detailed planning reference
- `.cursor/checklists/phase-2-checklist.md` — per-PR enforcement checklist

---

## Architecture

| Decision | Locked value |
|----------|--------------|
| Domain apps | **`apps/organizations`** + **`apps/projects`** only for Phase 2 persistence |
| Forbidden apps | **No `apps/workspace/` persistence app** in Phase 2 |
| Layering | **Service → Selector → API** (writes in services, reads in selectors, HTTP in API) |
| Views | **Thin views only** (≤15 logic lines per method) |
| Cross-module boundary | **Contracts-only** via `apps/contracts/` |
| Permission authority | **`permissions.services.PermissionService`** — **stub/interface only in Phase 2**; full impl Phase 3 |
| Inline role checks | **Forbidden** in views and services |

### Terminology (locked)

| Layer | Term |
|-------|------|
| Django model | `Organization`, `OrganizationMember` |
| UI / product copy | **Workspace** (not "Organization" in chrome) |
| API resource | `organization` (canonical); `workspaces` optional alias in `GET /api/me/context` |

### Hierarchy (locked)

```text
Global User (accounts.User)
  ↔ OrganizationMember
  ↔ Organization
    → Project
      → ProjectMember (project-scoped role)
```

---

## Organization Strategy

| Decision | Locked value |
|----------|--------------|
| Multi-org membership | **YES** — user may belong to multiple organizations via `OrganizationMember` |
| Phase 2 operational default | **Single seeded organization** for internal deployment |
| Org self-signup | **Not allowed** |
| Org creation API | **Superuser only** (`POST /api/organizations/`) |
| SaaS readiness | Schema supports multi-org; billing/tenant isolation **out of scope** |

### Organization model (locked fields)

```text
Organization
    id              UUID PK
    name            CharField(255)
    slug            SlugField, globally unique
    owner           FK(User), PROTECT
    created_by      FK(User), SET_NULL nullable
    branding        JSONField default {}
    settings        JSONField default {}
    is_active       BooleanField default True
    created_at, updated_at (foundation.BaseModel)
```

---

## Organization Membership Strategy

**Relationship (locked):**

```text
User ↔ OrganizationMember ↔ Organization
```

### OrganizationMember model (locked fields)

```text
OrganizationMember
    id              UUID PK
    organization    FK(Organization)
    user            FK(User)
    role            owner | admin | member
    joined_at       DateTimeField
    added_by        FK(User), SET_NULL nullable
    is_active       BooleanField default True
    UNIQUE(organization_id, user_id)
```

### Organization role enum (locked)

```text
owner
admin
member
```

### Organization membership rules (locked)

| Rule | Value |
|------|-------|
| Multi-organization | **Supported** — same user may belong to multiple orgs |
| Uniqueness | `UNIQUE(organization_id, user_id)` |
| One org role per user | **One role per org** — no multi-role rows per `(organization, user)` |
| Org role scope | Org roles govern **org actions only** |
| Org → project inheritance | **None** — org roles do **not** automatically grant project permissions |
| Org creator role | Organization creator becomes `OrganizationMember` with role **`owner`** |
| Default add role | **`member`** on `POST .../members/` |
| Last owner guard | Last `owner` **cannot be removed** without ownership transfer |
| Inactive membership | `is_active=False` **hides org access** — org omitted from user org list; org APIs return `403` |
| Member removal | `DELETE .../members/{user_id}` sets `is_active=False` (soft deactivate; row retained) |

### Organization roles (locked)

| Role | Scope |
|------|-------|
| `owner` | Full org control |
| `admin` | Manage org members + org metadata |
| `member` | View org; create projects (default); list org-visible projects |

**No software-delivery roles at organization level.**

---

## Project Strategy

| Decision | Locked value |
|----------|--------------|
| Parent | **Every project belongs to exactly one Organization** |
| Deletion | **Soft archive only** (`status=archived`) — no hard delete API |
| Key immutability | Project `key` **immutable after create** in Phase 2 |
| Slug immutability | Project `slug` **immutable after create** in Phase 2 |

### Project model (locked fields)

```text
Project
    id              UUID PK
    organization    FK(Organization), PROTECT
    key             CharField(2–10), uppercase A–Z0-9 — engineering identifier
    slug            SlugField — URL/UI identifier; lowercase kebab-case
    name            CharField(255)
    description     TextField, blank=True
    status          active | archived  (PROJECT_STATUS_CHOICES)
    lead            FK(User), SET_NULL nullable
    visibility      private | organization
    created_by      FK(User), SET_NULL nullable
    archived_at     DateTimeField nullable
    created_at, updated_at (foundation.BaseModel)
    UNIQUE(organization_id, key)
    UNIQUE(organization_id, slug)
```

### KEY vs SLUG (locked)

| Field | Purpose | Example |
|-------|---------|---------|
| `key` | Engineering identifier (issue keys, APIs) | `HRMS`, `AI` |
| `slug` | URL/UI identifier (routes, navigation) | `hrms`, `ai-platform` |

**Future route pattern:** `{organization_slug}/{project_slug}` — e.g. `/acme/hrms`, `/acme/ai-platform`.

### Project key rules (locked)

| Rule | Value |
|------|-------|
| Client supplies key | **Required on create** |
| Normalization | Server uppercases |
| Pattern | `^[A-Z0-9]{2,10}$` |
| Uniqueness | `UNIQUE(organization_id, key)` |
| Reserved keys | `API`, `AUTH`, `ADMIN`, `NULL`, `TEST`, `WWW` |

### Project slug rules (locked)

| Rule | Value |
|------|-------|
| Client supplies slug | **Required on create** |
| Normalization | Server lowercases |
| Pattern | `^[a-z0-9]+(-[a-z0-9]+)*$` (kebab-case) |
| Uniqueness | `UNIQUE(organization_id, slug)` — separate from `key` |
| Immutability | **Immutable after create** in Phase 2 |

### Project status enum (locked)

```text
PROJECT_STATUS_CHOICES = active | archived
```

| Rule | Value |
|------|-------|
| New project default | `active` |
| Delete behavior | **Archive only** — set `status=archived`, `archived_at=now` |
| Hard delete | **Forbidden** in Phase 2 |
| Archived projects | **Read-only**; **hidden from default lists**; recoverable in future phase |
| Extra statuses | **Forbidden** — no `planning`, `at_risk`, or free-text status |

---

## Project Membership Strategy

| Decision | Locked value |
|----------|--------------|
| Global user roles | **Forbidden** |
| Role on User model | **None** |
| Role on UserInvitation | **None** (Phase 1 unchanged) |
| Project roles | **Project-scoped only** via `ProjectMember` |
| Org → project role inheritance | **None** — org membership does not grant project roles |
| One role per project | **Yes** — `UNIQUE(project, user)` |

### ProjectMember model (locked fields)

```text
ProjectMember
    id              UUID PK
    project         FK(Project)
    user            FK(User)
    role            project_admin | project_manager | developer | qa | viewer
    added_by        FK(User), SET_NULL nullable
    joined_at       DateTimeField
    UNIQUE(project, user)
```

### Project roles (locked minimum matrix)

| Role | API value |
|------|-----------|
| Project Admin | `project_admin` |
| Project Manager | `project_manager` |
| Developer | `developer` |
| QA | `qa` |
| Viewer | `viewer` |

### Membership rules (locked)

| Rule | Value |
|------|-------|
| Project creator role | Auto `project_admin` |
| Default role on add | `developer` |
| Lead user | Must be existing `ProjectMember` if set |
| Last `project_admin` | Cannot remove/demote without replacement |
| Sole org `owner` | Cannot remove without ownership transfer |

### Visibility (locked)

| visibility | Project metadata visible to |
|------------|----------------------------|
| `organization` | Any organization member |
| `private` | Project members only |

---

## PermissionService Prep (interface only)

**Do not implement full RBAC in Phase 2.** Stub only.

### Frozen method signatures

```text
can_view_organization(user_id, organization_id) -> bool
can_manage_organization(user_id, organization_id) -> bool
can_create_project(user_id, organization_id) -> bool
can_view_project(user_id, project_id) -> bool
can_edit_project(user_id, project_id) -> bool
can_manage_members(user_id, project_id) -> bool
can_manage_workflow(user_id, project_id) -> bool   # returns False until workflow phase
```

Update `apps/contracts/permission_contract.py` Protocol to include all methods above.

---

## Contracts (locked)

| File | Status |
|------|--------|
| `organization_contract.py` | **Required** — new |
| `project_contract.py` | **Required** — extend existing stub |
| `membership_contract.py` | **Required** — new |
| `permission_contract.py` | **Required** — extend existing Protocol |

**DTO rule:** Frozen dataclasses only — **no ORM instances** cross module boundaries.

---

## API Surface (locked)

**Prefix:** `/api/` (no `/api/v1/`).

**Envelope:** `apps/foundation/responses.py`.

### Organization endpoints

| Method | Path |
|--------|------|
| GET | `/api/organizations/` |
| POST | `/api/organizations/` |
| GET | `/api/organizations/{org_id}/` |
| PATCH | `/api/organizations/{org_id}/` |
| GET | `/api/organizations/{org_id}/members/` |
| POST | `/api/organizations/{org_id}/members/` |
| PATCH | `/api/organizations/{org_id}/members/{user_id}/` |
| DELETE | `/api/organizations/{org_id}/members/{user_id}/` |

### Project endpoints

| Method | Path |
|--------|------|
| GET | `/api/organizations/{org_id}/projects/` |
| POST | `/api/organizations/{org_id}/projects/` |
| GET | `/api/projects/{project_id}/` |
| PATCH | `/api/projects/{project_id}/` |
| POST | `/api/projects/{project_id}/archive` |
| GET | `/api/projects/{project_id}/members/` |
| POST | `/api/projects/{project_id}/members/` |
| PATCH | `/api/projects/{project_id}/members/{user_id}/` |
| DELETE | `/api/projects/{project_id}/members/{user_id}/` |

### Context endpoint

| Method | Path |
|--------|------|
| GET | `/api/me/context` |

### Locked request shapes

**Create organization:**

```json
{ "name": "HKPMS", "slug": "hkpms", "owner_user_id": "uuid" }
```

**Create project:**

```json
{ "key": "HRMS", "slug": "hrms", "name": "HR Management System", "description": "", "visibility": "organization", "lead_user_id": null }
```

**Add org member:**

```json
{ "user_id": "uuid", "role": "member" }
```

**Add project member:**

```json
{ "user_id": "uuid", "role": "developer" }
```

### Locked error codes

- `400` — validation (org slug, project key, project slug, reserved key)
- `403` — permission denied; inactive `OrganizationMember`
- `404` — not found
- `409` — org slug collision; project key collision; project slug collision; duplicate membership

---

## Onboarding (locked)

### Phase 1 preserved

```text
Invite-only registration → global user → no org/project at register → no role at register
```

`UserInvitation` must **not** gain `organization_id`, `project_id`, or `role` fields.

### Phase 2 flow (locked)

```text
Super Admin
  → create organization (creator becomes owner)
  → add users to organization (default role: member)
  → create project (creator becomes project_admin)
  → assign project roles
```

Users remain **globally available** after registration (Phase 1 unchanged).

| Question | Answer |
|----------|--------|
| Can user exist without organization? | **YES** — authenticated user with empty org list |
| Org invite APIs | **Out of scope** |
| User search for membership | **Out of scope** — supply `user_id` explicitly |

---

## Explicitly Out of Scope

The following must **not** be added during Phase 2:

- Issues, sprints, boards, Kanban, backlog
- Workflow statuses, transitions, `TransitionService`
- Notifications, activity, search, dashboard KPIs
- **PermissionService full implementation** / RBAC engine
- **Invite UI** / invitation CRUD (org or project)
- **Project invitation APIs**
- **Workspace self-signup**
- Labels, components, favorites
- Hard delete (org or project)
- Custom roles, per-user ACL overrides
- Billing, SSO, avatar upload, user email change
- `UserPreference` API
- Changes to Phase 1 auth endpoints or `UserInvitation` schema

---

## Locked Implementation Order

| # | Slice | Scope |
|---|-------|-------|
| 1 | **Module layout & settings** | App structure, URL wiring, `permissions` scaffold |
| 2 | **Models & migrations** | Organization, OrganizationMember, Project, ProjectMember |
| 3 | **Contracts** | Four contract files + selector wiring |
| 4 | **Selectors** | Read projections, visibility filter, key suggestion |
| 5 | **Services** | Org/project CRUD, membership guards |
| 6 | **PermissionService stub** | Frozen signatures, thin DRF wrappers |
| 7 | **API layer** | Frozen endpoints + `GET /api/me/context` |
| 8 | **Tests & bootstrap** | Test matrix, `bootstrap_organization` command, arch tests |

---

## Migration & Bootstrap (locked)

| Concern | Approach |
|---------|----------|
| Existing Phase 1 users | `bootstrap_organization` command adds all users to default org |
| Multi-org future | Schema ready; no migration needed |
| Org slug collisions | Global unique + `409` |
| Project key collisions | Per-org unique + `409` |
| Project slug collisions | Per-org unique + `409` |
| Project deletion | Archive only (`active` → `archived`) |
| Inactive org membership | `is_active=False` hides org from user |

---

## Change Control

To modify anything in this freeze:

1. Explicit written approval required
2. Update this file with rationale and date
3. Update `.cursor/plans/phase-2-org-project-foundation.md` if planning detail changes
4. Verify Phase 1 freeze remains intact
5. Re-run `.cursor/checklists/phase-2-checklist.md` before merge

**Phase 2 is complete when:** all eight slices merged, checklist passes, bootstrap command validated, and endpoints match this document.
