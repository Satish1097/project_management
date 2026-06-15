# Phase 2 — Organization + Project Foundation (Planning Only)

> **PHASE 2 IS PLANNING — NO IMPLEMENTATION IN THIS DOCUMENT**
>
> Locked decisions (when implementation starts): [`.cursor/freeze/phase-2-freeze.md`](../freeze/phase-2-freeze.md)  
> Per-PR checklist: [`.cursor/checklists/phase-2-checklist.md`](../checklists/phase-2-checklist.md)  
> Prerequisites: [`.cursor/freeze/phase-1-freeze.md`](../freeze/phase-1-freeze.md) · [`.cursor/plans/ARCHITECTURE_RULES.md`](ARCHITECTURE_RULES.md)

**Status:** frozen for planning — implement per locked slices; scope changes require freeze update.

**Analysis baseline:** Phase 1 complete (`apps/accounts` with invite-only auth, JWT, global users). Legacy scaffolds `apps/organizations` and `apps/projects` exist with empty models. Contract stubs exist for `project_contract.py` and `permission_contract.py`. Frontend uses **Workspace** in UI and **Project** with Jira-style keys in mock data.

---

## 1. Architecture Recommendation

### Decision: **Two domain apps + contracts-first boundaries**

| App | Owns | Does NOT own |
|-----|------|--------------|
| **`apps/organizations`** | `Organization`, `OrganizationMember`, org CRUD, org membership | Project models, project roles, issues |
| **`apps/projects`** | `Project`, `ProjectMember`, project CRUD, project membership | Issue/sprint/workflow models |

Do **not** create `apps/workspace/` as a persistence app in Phase 2. **Workspace** is a **UI/product term** and a **future read-only aggregation module** (dashboard metrics, cross-project views). Persistence and write APIs live in `organizations` + `projects`.

### Terminology mapping (locked)

| Layer | Term | Notes |
|-------|------|-------|
| Django model | `Organization` | Canonical persistence name |
| Django model | `OrganizationMember` | Junction table; not "WorkspaceMember" |
| API JSON (org resource) | `organization` | Canonical API resource key |
| API JSON (org list in me context) | `workspaces` | Optional alias in `GET /api/me/context` for frontend alignment |
| UI copy | **Workspace** | Per `terminology.md` — do not say "Organization" in user-facing chrome |
| Product hierarchy | `Global User → Organization → Project → ProjectMember` | Phase 2 foundation only |

### Layering (unchanged from ARCHITECTURE_RULES)

```text
Service  → writes, orchestration, validation beyond serializer
Selector → read-only queries, projections
API      → thin views (≤15 logic lines), serializers, envelope
Contracts → DTOs + narrow read interfaces; no ORM leakage
```

### Cross-module communication

```text
apps/accounts     ──identity_contract──►  other modules
apps/organizations ──organization_contract──►  projects, permissions (future)
apps/projects     ──project_contract, membership_contract──►  future issue/sprint/board
all modules       ──permission_contract (Protocol only)──►  permissions app (Phase 3 impl)
```

**Forbidden:** `from apps.projects.models import Project` inside `apps/organizations/`.

### Permission authority (prep only)

Phase 2 **defines** `PermissionService` method signatures and DRF wrapper pattern. Phase 2 **does not implement** role-to-permission resolution logic — that ships in Phase 3. Phase 2 services perform **structural validation only** (existence, uniqueness, membership record creation) using selectors; authorization gates are stubbed or marked `TODO(Phase 3)`.

---

## 2. Entity Relationship Proposal

```text
┌─────────────┐       ┌────────────────────┐       ┌──────────────┐
│    User     │◄──────│ OrganizationMember │──────►│ Organization │
│ (accounts)  │       │  role: owner|       │       │  slug (uniq) │
│  global     │       │        admin|member  │       │  owner FK    │
└──────┬──────┘       │  is_active         │       └──────┬───────┘
       │              └────────────────────┘               │
       │              ┌────────────────────┐               │
       └──────────────│   ProjectMember    │◄──────────────┘
                      │  role: project_*   │
                      └─────────┬──────────┘
                                │
                      ┌─────────▼──────────┐
                      │      Project       │
                      │  key (per-org uniq)│
                      │  slug (per-org)    │
                      │  status: active|   │
                      │         archived   │
                      └────────────────────┘
```

### Cardinality rules (locked)

| Relationship | Cardinality | Constraint |
|--------------|-------------|------------|
| User ↔ Organization | **Many-to-many** via `OrganizationMember` | `UNIQUE(organization_id, user_id)` |
| Organization → Project | **One-to-many** | `Project.organization_id` required |
| User ↔ Project | **Many-to-many** via `ProjectMember` | `UNIQUE(project, user)` |
| User global existence | **Independent** of org/project | Phase 1 preserved |

---

## 3. Frozen Architecture Decisions

### A. Organization Strategy

#### Can a user belong to multiple organizations?

**Recommendation: YES — schema and contracts support multi-org membership.**

| Factor | Rationale |
|--------|-----------|
| Data model | `OrganizationMember` junction is the correct long-term shape; avoids painful migration if SaaS expands |
| Phase 1 preservation | Users remain globally registered; org attachment is a **separate step** — compatible with multi-org |
| Internal deployment (now) | Bootstrap with **one** organization; all users added as members — no multi-org UX required in Phase 2 |
| Phase 2 UX scope | List orgs user belongs to; operate in **one active org context** per session (header switcher deferred to frontend slice) |

**Rejected alternative:** Single-org-only schema (user FK on Organization). Rejected because it blocks future multi-org without migration and conflates identity with tenancy.

#### Internal-only vs future SaaS readiness

| Concern | Phase 2 decision |
|---------|------------------|
| Product mode | **Internal-only** operational default (single seeded org) |
| Schema | **SaaS-ready** — multi-org junction, global slug uniqueness, no hard-coded single-tenant assumptions in services |
| Org creation | **Superuser / bootstrap command only** — no self-signup, no public org registration |
| Billing / tenant isolation | Out of scope |

#### Organization model fields (locked)

```text
Organization
    id              UUID PK
    name            CharField(255)
    slug            SlugField, globally unique, indexed
    owner           FK(User), PROTECT — primary owner; transferable in future
    created_by      FK(User), SET_NULL nullable — audit; may differ from owner
    branding        JSONField default {} — Phase 2: optional logo_url, accent_color
    settings        JSONField default {} — future org preferences
    is_active       BooleanField default True — soft-disable org
    created_at      DateTimeField (via foundation.BaseModel)
    updated_at      DateTimeField (via foundation.BaseModel)
```

| Field | Decision |
|-------|----------|
| **owner** | Required at creation. Owner must be (or become) an `OrganizationMember` with role `owner`. |
| **created_by** | Set from authenticated actor on create; nullable for bootstrap migrations. |
| **slug** | Required. URL-safe (`^[a-z0-9-]+$`, 3–63 chars). Used in routes and bootstrap. |
| **branding** | Minimal JSON placeholder — no upload pipeline in Phase 2. |
| **settings** | Empty object default — no settings API in Phase 2. |

---

### A2. Organization Membership Strategy (locked)

**Relationship (locked):**

```text
User ↔ OrganizationMember ↔ Organization
```

#### OrganizationMember model fields (locked)

```text
OrganizationMember
    id              UUID PK
    organization    FK(Organization), CASCADE
    user            FK(User), CASCADE
    role            CharField — choices: owner | admin | member
    joined_at       DateTimeField auto_now_add
    added_by        FK(User), SET_NULL nullable
    is_active       BooleanField default True
    UNIQUE(organization_id, user_id)
```

#### Organization role enum (locked)

```text
owner
admin
member
```

#### Organization membership rules (locked)

| Rule | Value |
|------|-------|
| Multi-organization | **Supported** — same user may belong to multiple orgs |
| Uniqueness | `UNIQUE(organization_id, user_id)` |
| One org role per user | **One role per org** per membership row |
| Org role scope | Org roles govern **org actions only** |
| Org → project inheritance | **None** — org roles do **not** automatically grant project permissions |
| Org creator role | Organization creator becomes `OrganizationMember` with role **`owner`** |
| Default add role | **`member`** on member add |
| Last owner guard | Last `owner` **cannot be removed** without ownership transfer |
| Inactive membership | `is_active=False` **hides org access** — org omitted from lists; org APIs return `403` |
| Member removal | `DELETE .../members/{user_id}` sets `is_active=False` (soft deactivate; row retained) |

#### Organization roles (locked — minimal, not global)

| Role | Capabilities (Phase 2) |
|------|------------------------|
| `owner` | Full org control; transfer ownership (future); cannot be removed if sole owner |
| `admin` | Manage org members (except owner demotion rules); edit org metadata |
| `member` | View org; list org projects (subject to project visibility); create projects (default on) |

**No `developer` / `qa` at organization level.** Software delivery roles are **project-scoped only**.

---

### B. Project Strategy

#### Project belongs to Organization (locked)

Every `Project` has a required `organization_id` FK. Projects do not exist outside an organization.

#### Project model fields (locked)

```text
Project
    id              UUID PK
    organization    FK(Organization), PROTECT
    key             CharField(2–10) — uppercase A–Z0-9; engineering identifier
    slug            SlugField — lowercase kebab-case; URL/UI identifier
    name            CharField(255)
    description     TextField blank=True
    status          CharField — PROJECT_STATUS_CHOICES: active | archived
    lead            FK(User), SET_NULL nullable
    visibility      CharField — choices: private | organization
    created_by      FK(User), SET_NULL nullable
    archived_at     DateTimeField nullable
    created_at      DateTimeField (via foundation.BaseModel)
    updated_at      DateTimeField (via foundation.BaseModel)
    UNIQUE(organization_id, key)
    UNIQUE(organization_id, slug)
    INDEX(organization, status)
```

| Field | Decision |
|-------|----------|
| **key** | Engineering identifier for issue keys and APIs (e.g. `HRMS`, `AI`). Immutable after create. |
| **slug** | URL/UI identifier (e.g. `hrms`, `ai-platform`). Immutable after create. Separate from `key`. |
| **status** | `PROJECT_STATUS_CHOICES` only: `active` \| `archived`. No other statuses in Phase 2. |
| **lead** | Optional. If set, user **must** be a `ProjectMember`. Lead does not imply `project_admin` unless role says so. |
| **visibility** | `organization` = any org member can see project metadata; `private` = project members only. |

#### KEY vs SLUG (locked)

| Field | Purpose | Example pair |
|-------|---------|--------------|
| `key` | Engineering identifier | `key="HRMS"` |
| `slug` | URL/UI identifier | `slug="hrms"` |
| `key` | Short acronym projects | `key="AI"` |
| `slug` | Descriptive URL segment | `slug="ai-platform"` |

**Future route pattern:** `{organization_slug}/{project_slug}` — e.g. `/acme/hrms`, `/acme/ai-platform`.

#### Project slug rules (locked)

| Rule | Value |
|------|-------|
| Client supplies slug | **Required on create** |
| Normalization | Server lowercases |
| Pattern | `^[a-z0-9]+(-[a-z0-9]+)*$` (kebab-case) |
| Uniqueness | `UNIQUE(organization_id, slug)` — independent of `key` |
| Immutability | **Immutable after create** in Phase 2 |

#### Project status enum (locked)

```text
PROJECT_STATUS_CHOICES = active | archived
```

| Rule | Value |
|------|-------|
| New project default | `active` |
| Delete behavior | **Archive only** — `status=archived`, `archived_at` set |
| Hard delete | **Forbidden** in Phase 2 |
| Archived projects | **Read-only**; **excluded from default project lists**; unarchive deferred to future phase |
| Extra statuses | **Forbidden** — no `planning`, `at_risk`, or free-text values |

#### Project key generation (locked)

| Rule | Value |
|------|-------|
| Input | Client supplies `key` on create (required) |
| Normalization | Server uppercases; strip whitespace |
| Pattern | `^[A-Z0-9]{2,10}$` |
| Uniqueness | **Per organization** — `(organization_id, key)` unique |
| Reserved keys | Reject: `API`, `AUTH`, `ADMIN`, `NULL`, `TEST`, `WWW` (extendable list in service constant) |
| Suggestion helper | Selector `suggest_project_key(name) → str` — acronym from name; **advisory only**, not auto-assigned |
| Examples | `ABC`, `HRMS`, `AI`, `MOB` |

**Rejected:** Globally unique project keys — unnecessary for internal Jira-like model and complicates multi-org.

#### Project deletion (locked)

**Soft archive only** in Phase 2: set `status=archived` via `PROJECT_STATUS_CHOICES`, set `archived_at`. No hard delete API. Archived projects are read-only and hidden from default lists. Hard delete reserved for superuser admin tooling in future.

---

### C. Project Membership Strategy (VERY IMPORTANT)

#### No global roles (locked)

- `User` has **no** `role` field.
- `UserInvitation` has **no** role or org/project scope (Phase 1 frozen — unchanged).
- `is_superuser` / `is_staff` are **Django admin/bootstrap only** — never used in product authorization (ARCHITECTURE_RULES §8).

#### ProjectMember model (locked)

```text
ProjectMember
    id              UUID PK
    project         FK(Project), CASCADE
    user            FK(User), CASCADE
    role            CharField — see role enum below
    added_by        FK(User), SET_NULL nullable
    joined_at       DateTimeField auto_now_add
    UNIQUE(project, user)
```

#### Project roles (locked minimum matrix)

| Role | API value | Intent |
|------|-----------|--------|
| Project Admin | `project_admin` | Full project control: settings, members, archive, future workflow config |
| Project Manager | `project_manager` | Edit project metadata, manage members; no destructive archive in Phase 2 |
| Developer | `developer` | Future: issues, sprints, assignments (membership recorded in Phase 2; no issue perms yet) |
| QA | `qa` | Future: view + QA transitions (membership only in Phase 2) |
| Viewer | `viewer` | Read-only project access (metadata + future issues) |

**Default role on add:** `developer` (configurable constant; creator gets `project_admin`).

**Creator rule:** User who creates a project is automatically inserted as `ProjectMember` with role `project_admin`.

#### Per-project role independence (locked)

```text
User A → Project X → project_admin
User A → Project Y → developer
User A → Project Z → viewer
```

Enforced by `ProjectMember` uniqueness per `(project, user)` — one role per project.

#### Role inheritance?

**Recommendation: NO inheritance between organization role and project role.**

| Question | Answer |
|----------|--------|
| Does org `admin` imply `project_admin` on all projects? | **No** — project access requires explicit `ProjectMember` |
| Does org `owner` imply project roles? | **No** — except bootstrap/emergency **view** via `can_view_organization` for org metadata, not project data |
| Can org `member` see all projects? | Only if `visibility=organization` **or** they are a `ProjectMember` |

#### Organization-level access to projects (locked)

| visibility | Who can list/view project metadata |
|------------|-------------------------------------|
| `organization` | Any `OrganizationMember` with `can_view_organization` |
| `private` | `ProjectMember` only |

Issue/sprint data remains out of scope — metadata only in Phase 2.

---

### D. PermissionService Prep (interface only — no implementation)

Phase 2 creates `apps/permissions/` **scaffold only** (empty service stub). All methods below are **frozen signatures**; implementation deferred to **Phase 3**.

```text
permissions.services.PermissionService

# Organization scope (NEW — add to ARCHITECTURE_RULES catalog)
can_view_organization(user_id, organization_id) -> bool
can_manage_organization(user_id, organization_id) -> bool
can_create_project(user_id, organization_id) -> bool

# Project scope (prep — align with ARCHITECTURE_RULES)
can_view_project(user_id, project_id) -> bool
can_edit_project(user_id, project_id) -> bool
can_manage_members(user_id, project_id) -> bool
can_manage_workflow(user_id, project_id) -> bool   # stub returns False until workflow phase
```

**Phase 2 enforcement interim:** DRF views call `PermissionService` methods; stub returns `False` for manage actions and membership-scoped `True` for view where selector confirms `ProjectMember` / `OrganizationMember` exists. Document this as **temporary** until Phase 3 centralizes the role matrix.

**Forbidden in Phase 2 (same as ARCHITECTURE_RULES):**

```python
if member.role == "project_admin":   # NO
if user.is_staff:                    # NO
```

---

### E. Contracts-First Boundaries

Define/update in `apps/contracts/` **before** implementing each slice.

#### `organization_contract.py` (new)

```text
OrganizationDTO(id, name, slug, is_active)
OrganizationMemberDTO(user_id, organization_id, role, is_active)
OrganizationSummaryDTO(id, name, slug, project_count, member_count)

get_organization_by_id(org_id) -> OrganizationDTO | None
get_organizations_for_user(user_id) -> list[OrganizationDTO]
get_organization_member(user_id, org_id) -> OrganizationMemberDTO | None
is_organization_member(user_id, org_id) -> bool
```

#### `project_contract.py` (extend existing stub)

```text
ProjectDTO(id, organization_id, key, slug, name, status, visibility, lead_id)
ProjectSummaryDTO(id, key, slug, name, status, open_issue_count=0, active_sprint_id=None)
ProjectMemberDTO(user_id, project_id, role)

get_project_by_id(project_id) -> ProjectDTO | None
get_project_summary(project_id) -> ProjectSummaryDTO | None
get_projects_for_organization(org_id, user_id) -> list[ProjectSummaryDTO]
```

`open_issue_count` and `active_sprint_id` return **0 / None** in Phase 2 (no issue/sprint tables).

#### `membership_contract.py` (new)

```text
get_project_member(user_id, project_id) -> ProjectMemberDTO | None
get_project_role(user_id, project_id) -> str | None
list_project_members(project_id) -> list[ProjectMemberDTO]
list_organization_members(org_id) -> list[OrganizationMemberDTO]
user_has_project_access(user_id, project_id) -> bool
```

#### `permission_contract.py` (extend existing Protocol)

Add to `PermissionServiceProtocol`:

```text
can_view_organization(user_id, organization_id) -> bool
can_manage_organization(user_id, organization_id) -> bool
can_create_project(user_id, organization_id) -> bool
can_manage_workflow(user_id, project_id) -> bool
```

DTO strategy: **frozen dataclasses**, no ORM instances cross module boundaries. Contract functions delegate to owning app's selectors internally.

---

### F. API Planning (frozen surface — no implementation)

**URL prefix:** `/api/` (consistent with Phase 1 — no `/api/v1/`).

**Envelope:** `apps/foundation/responses.py` — `{ success, message, data }` / `{ success, message, errors }`.

#### Organization APIs

| Method | Path | Owner | Auth | Permission (Phase 3) |
|--------|------|-------|------|---------------------|
| GET | `/api/organizations/` | `organizations` selectors | Authenticated | member of each listed org |
| POST | `/api/organizations/` | `organization_service.create` | Superuser only | bootstrap |
| GET | `/api/organizations/{org_id}/` | selectors | Authenticated | `can_view_organization` |
| PATCH | `/api/organizations/{org_id}/` | `organization_service.update` | Authenticated | `can_manage_organization` |
| GET | `/api/organizations/{org_id}/members/` | selectors | Authenticated | `can_view_organization` |
| POST | `/api/organizations/{org_id}/members/` | `membership_service.add_org_member` | Authenticated | `can_manage_organization` |
| PATCH | `/api/organizations/{org_id}/members/{user_id}/` | `membership_service.update_org_member` | Authenticated | `can_manage_organization` |
| DELETE | `/api/organizations/{org_id}/members/{user_id}/` | `membership_service.remove_org_member` | Authenticated | `can_manage_organization` |

**POST /api/organizations/ request:**

```json
{
  "name": "HKPMS",
  "slug": "hkpms",
  "owner_user_id": "uuid"
}
```

**POST /api/organizations/{org_id}/members/ request:**

```json
{
  "user_id": "uuid",
  "role": "member"
}
```

#### Project APIs

| Method | Path | Owner | Auth | Permission (Phase 3) |
|--------|------|-------|------|---------------------|
| GET | `/api/organizations/{org_id}/projects/` | `projects` selectors | Authenticated | `can_view_organization` + visibility filter |
| POST | `/api/organizations/{org_id}/projects/` | `project_service.create` | Authenticated | `can_create_project` |
| GET | `/api/projects/{project_id}/` | selectors | Authenticated | `can_view_project` |
| PATCH | `/api/projects/{project_id}/` | `project_service.update` | Authenticated | `can_edit_project` |
| POST | `/api/projects/{project_id}/archive` | `project_service.archive` | Authenticated | `can_edit_project` + `project_admin` |
| GET | `/api/projects/{project_id}/members/` | selectors | Authenticated | `can_view_project` |
| POST | `/api/projects/{project_id}/members/` | `membership_service.add_project_member` | Authenticated | `can_manage_members` |
| PATCH | `/api/projects/{project_id}/members/{user_id}/` | `membership_service.update_project_member` | Authenticated | `can_manage_members` |
| DELETE | `/api/projects/{project_id}/members/{user_id}/` | `membership_service.remove_project_member` | Authenticated | `can_manage_members` |

**POST /api/organizations/{org_id}/projects/ request:**

```json
{
  "key": "HRMS",
  "slug": "hrms",
  "name": "HR Management System",
  "description": "",
  "visibility": "organization",
  "lead_user_id": null
}
```

**POST /api/projects/{project_id}/members/ request:**

```json
{
  "user_id": "uuid",
  "role": "developer"
}
```

#### Me context API (frontend alignment)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me/context` | Returns `{ user, organizations[], active_organization_id?, projects[] }` for shell bootstrap |

`active_organization_id` — nullable; frontend `EmptyWorkspacePage` when `organizations` is empty.

#### Response shapes (examples)

**GET /api/projects/{id}/ success:**

```json
{
  "success": true,
  "message": "",
  "data": {
    "project": {
      "id": "uuid",
      "organization_id": "uuid",
      "key": "HRMS",
      "slug": "hrms",
      "name": "HR Management System",
      "description": "",
      "status": "active",
      "visibility": "organization",
      "lead": { "id": "uuid", "display_name": "Jane Doe" },
      "created_at": "2026-06-05T00:00:00Z"
    }
  }
}
```

**GET /api/projects/{id}/members/ success:**

```json
{
  "success": true,
  "message": "",
  "data": {
    "members": [
      {
        "user_id": "uuid",
        "email": "dev@example.com",
        "display_name": "Jane Doe",
        "role": "project_admin",
        "joined_at": "2026-06-05T00:00:00Z"
      }
    ]
  }
}
```

User display fields resolved via `identity_contract.get_users_by_ids`.

#### Error codes (locked)

| Code | Condition |
|------|-----------|
| `400` | Invalid slug/key format; reserved key; validation errors |
| `403` | Permission denied (via PermissionService) |
| `404` | Org/project/member not found |
| `409` | Org slug collision; project key collision; project slug collision; duplicate membership |

---

### G. Onboarding Flow Alignment

#### Phase 1 truth (preserved)

```text
Users register through invite (UserInvitation)
Users become globally available (no org/project at register)
No role at registration
```

`UserInvitation` **unchanged** — still no `organization_id`, `role`, or `project_id`.

#### Phase 2 onboarding model (locked)

```text
Super Admin
  → create organization (creator becomes owner)
  → add users to organization (default role: member)
  → create project (creator becomes project_admin)
  → assign project roles
```

Users remain **globally available** after registration (Phase 1 unchanged).

#### Can a user exist without an organization?

**YES (locked).**

- Registration (Phase 1) does **not** create org membership.
- User can authenticate and call `GET /api/me` but sees empty workspace until added to an organization.
- Aligns with frontend `EmptyWorkspacePage` and invite-only registration.
- Org membership is an **administrative assignment** using known `user_id` (from accounts admin or `GET /api/me` in trusted flows) — not invite-to-org in Phase 2.

#### User discovery for membership add

Phase 2 provides **no user search API**. Admins supply `user_id` from admin tooling or prior knowledge. User search is Phase 14 (Search) scope.

---

### H. Risks & Migration Strategy

| Risk | Impact | Mitigation |
|------|--------|------------|
| Phase 1 users without org | Empty workspace after login | `bootstrap_organization` management command: create default org, add all active users as `member`, promote bootstrap user to `owner` |
| Future multi-org | UX complexity | Schema ready via `OrganizationMember`; Phase 2 ships single-org bootstrap; org switcher is frontend follow-up |
| Slug collisions (org) | Org create fails | Global unique on `Organization.slug`; return `409` |
| Project key collisions | Project create fails | `UNIQUE(organization_id, key)`; reserved-key validation; return `409` |
| Project slug collisions | Project create fails | `UNIQUE(organization_id, slug)`; return `409` |
| Inactive org membership | User loses org access | `OrganizationMember.is_active=False` hides org from lists and APIs |
| Membership uniqueness | Duplicate rows | DB unique constraints on `(organization, user)` and `(project, user)` |
| Project deletion data loss | Accidental data wipe | Soft archive only; no hard delete in Phase 2 |
| Removing last project_admin | Orphan project | Service guard: cannot remove/demote last `project_admin` without replacement |
| Removing sole org owner | Orphan org | Service guard: cannot remove sole `owner` without transfer |
| Lead not a member | Invalid reference | Service validates `lead_user_id` is `ProjectMember` before save |
| PermissionService stub | False negatives/positives | Document interim behavior; complete in Phase 3 before issue APIs |
| Terminology drift (workspace vs organization) | Frontend/backend mismatch | Freeze mapping table; `GET /api/me/context` may expose `workspaces` key as alias |
| `apps/projects` vs `apps/project` naming | Import confusion | Keep existing plural `apps/projects` scaffold — do not rename app label in Phase 2 |

#### Migration command (locked for implementation)

```text
python manage.py bootstrap_organization \
  --name "HKPMS" \
  --slug "hkpms" \
  --owner-email admin@example.com \
  --add-all-users
```

Idempotent: skip if slug exists; log actions.

---

## 4. App Structure (implementation reference)

### `apps/organizations/`

```text
apps/organizations/
  models/
    organization.py
    membership.py          # OrganizationMember
  services/
    organization_service.py
    membership_service.py  # org member add/update/remove
  selectors.py
  api/
    serializers.py
    views.py
    urls.py
  tests/
    test_organization_crud.py
    test_org_membership.py
  admin.py
```

### `apps/projects/`

```text
apps/projects/
  models/
    project.py
    membership.py          # ProjectMember
  services/
    project_service.py
    membership_service.py  # project member add/update/remove
  selectors.py
  api/
    serializers.py
    views.py
    urls.py
  tests/
    test_project_crud.py
    test_project_membership.py
    test_project_key.py
  admin.py
```

### `apps/permissions/` (scaffold only)

```text
apps/permissions/
  services/
    permission_service.py  # stub raising NotImplementedError or minimal membership checks
  apps.py
```

---

## 5. Slice-by-Slice Implementation Plan

Implement strictly in order. One slice per PR/session.

| # | Slice | Scope |
|---|-------|-------|
| 1 | **Module layout & settings** | Restructure `organizations` + `projects` folders; register URLs in `core/urls.py`; add `permissions` app scaffold; update `INSTALLED_APPS` |
| 2 | **Models & migrations** | `Organization`, `OrganizationMember`, `Project`, `ProjectMember`; constraints, indexes; admin registration |
| 3 | **Contracts** | `organization_contract.py`, `membership_contract.py`; extend `project_contract.py`, `permission_contract.py`; wire contract stubs to selectors |
| 4 | **Selectors** | Read projections for orgs, projects, memberships; visibility filtering; archived exclusion; `suggest_project_key` |
| 5 | **Services** | Org CRUD, project CRUD (create assigns creator as `project_admin`), membership add/update/remove with structural guards |
| 6 | **PermissionService stub** | Frozen method signatures; thin DRF permission classes calling stub; document interim behavior |
| 7 | **API layer** | Serializers, thin views, frozen endpoints, `GET /api/me/context` |
| 8 | **Tests & bootstrap** | Full test matrix; `bootstrap_organization` command; architecture import-boundary tests; README endpoint table |

---

## 6. Explicitly Out of Scope (Phase 2)

- Issues, issue keys, backlog
- Sprints, boards, Kanban
- Workflow statuses, transitions, `TransitionService`
- Notifications, activity feeds, search
- **PermissionService full implementation** / RBAC engine / role-permission matrix
- **Invite UI** and **invitation CRUD APIs** (org or project)
- **Project invitation APIs**
- **Workspace self-signup** / public organization registration
- User email change, avatar upload
- Org/project branding upload pipelines
- `UserPreference` API
- Favorites, recents, dashboard KPIs
- Labels, components, versions, releases
- Hard delete for projects or organizations
- Custom roles, per-user permission overrides
- Billing, multi-tenant DNS, subdomain routing
- SSO / social auth

Phase 2 delivers **foundational tenancy + project shell + membership with roles** — nothing that mutates or displays issues.

---

## 7. Testing Plan (for implementation)

| Area | Tests |
|------|-------|
| Organization CRUD | create (superuser), patch, list for member, 403 for non-member |
| Slug uniqueness | duplicate slug → `409` |
| Org membership | add, update role, deactivate (`is_active`); sole owner guard |
| Project CRUD | create with key + slug, patch, archive; key uppercase; slug kebab-case |
| Key uniqueness | duplicate key in same org → `409`; same key different org → allowed |
| Slug uniqueness | duplicate slug in same org → `409`; slug independent of key |
| Project status | only `active` \| `archived`; new project defaults `active`; archived hidden from default lists |
| Reserved keys | `API` → `400` |
| Project membership | add, role change, remove; last admin guard |
| Cross-project roles | same user different roles on different projects |
| Visibility | `private` project hidden from non-members in org list |
| Creator rule | creator is `project_admin` |
| Global user | user without org → empty org list, not 403 on `GET /api/organizations/` |
| Contracts | DTO shape tests; no ORM in contract return types |
| Architecture | import boundaries; thin views; no inline role checks |
| Bootstrap command | idempotent seed |

---

## 8. Change Control / Freeze Guidance

1. Phase 2 implementation **must not** modify Phase 1 freeze decisions without explicit approval.
2. Any scope or API change requires updating `.cursor/freeze/phase-2-freeze.md` with rationale and date.
3. Update this plan document when planning detail changes.
4. Run `.cursor/checklists/phase-2-checklist.md` before every Phase 2 PR merge.
5. Add new `PermissionService` methods to `ARCHITECTURE_RULES.md` catalog before use in Phase 3+.

**Phase 2 is complete when:** all eight slices merged, checklist passes, bootstrap command seeds org + projects, and frozen endpoints validated against freeze doc.

---

## Key Alignment Notes

| Topic | Decision |
|-------|----------|
| Phase 1 preservation | Invite-only auth; global users; no invitation scope fields |
| Multi-org | Supported in schema; single-org bootstrap for internal deploy |
| Global roles | **Forbidden** |
| Project roles | `project_admin`, `project_manager`, `developer`, `qa`, `viewer` |
| Org roles | `owner`, `admin`, `member` only |
| Org membership | `OrganizationMember` with `added_by`, `is_active`; creator → `owner` |
| Role inheritance | **None** org → project |
| Project slug | Required; kebab-case; unique per org; immutable |
| Project status | `PROJECT_STATUS_CHOICES`: `active` \| `archived` only |
| PermissionService | Interface frozen; implementation Phase 3 |
| Contracts | Four contract files; DTOs only across modules |
| API prefix | `/api/` |
| Workspace vs Organization | Model/API: Organization; UI: Workspace |
