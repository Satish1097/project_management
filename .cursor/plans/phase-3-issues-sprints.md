# Phase 3 — Issues + Sprints + Workflow Foundation (Planning Only)

> **PHASE 3 IS PLANNING — NO IMPLEMENTATION IN THIS DOCUMENT**
>
> Locked decisions (when implementation starts): [`.cursor/freeze/phase-3-freeze.md`](../freeze/phase-3-freeze.md)  
> Per-PR checklist: [`.cursor/checklists/phase-3-checklist.md`](../checklists/phase-3-checklist.md)  
> Prerequisites: [`.cursor/freeze/phase-1-freeze.md`](../freeze/phase-1-freeze.md) · [`.cursor/freeze/phase-2-freeze.md`](../freeze/phase-2-freeze.md) · [`.cursor/plans/ARCHITECTURE_RULES.md`](ARCHITECTURE_RULES.md)

**Status:** frozen for planning — implement per locked slices; scope changes require freeze update.

**Analysis baseline:** Phase 2 complete (`apps/organizations`, `apps/projects`, `ProjectMember` roles, `PermissionService` partial implementation). Empty scaffold `apps/issues/` exists. Contract stubs exist for `issue_contract.py`, `sprint_contract.py`, `workflow_contract.py`. Frontend expects Jira-style keys (`HRMS-42`), backlog, sprint planning, and Kanban columns.

---

## 1. Architecture Recommendation

### Decision: **Three domain apps + contracts-first boundaries**

| App | Owns | Does NOT own |
|-----|------|--------------|
| **`apps/issues`** | `Issue`, issue CRUD, assign, backlog/kanban read selectors, transition API facade | Workflow rules, sprint lifecycle, board projection module (future) |
| **`apps/sprints`** | `Sprint`, sprint CRUD, start/complete, bulk issue moves | Issue field mutations except `sprint_id` assignment orchestration |
| **`apps/workflow`** | `WorkflowStatus`, `WorkflowTransition`, `TransitionService`, frozen default workflow seed | Issue persistence, sprint lifecycle |

**Workflow location: `apps/workflow` (separate app) — NOT embedded in `apps/issues`.**

| Factor | Rationale |
|--------|-----------|
| ARCHITECTURE_RULES §5 | **Single authority:** `workflow.services.TransitionService` — must not live inside issues |
| ARCHITECTURE_RULES §6 | Issues must not import workflow models; communicate via `workflow_contract` |
| Separation of concerns | Issue = entity lifecycle; Workflow = state machine rules + permission-gated transitions |
| Future scale | Custom workflows (out of scope Phase 3) extend workflow app without bloating issues |
| Test enforcement | `tests/architecture/test_transition_centralization.py` expects `apps/workflow/services/transition_service.py` |
| Board / mytasks | Read workflow config via contracts; never duplicate transition logic |

**Rejected alternative:** Workflow inside `apps/issues`. Rejected because it violates transition centralization, couples entity CRUD to state machine, and blocks clean `board`/`mytasks` read projections.

### App naming (locked)

| Folder | Django label | Notes |
|--------|--------------|-------|
| `apps/issues/` | `issues` | Matches existing scaffold (`IssuesConfig`) |
| `apps/sprints/` | `sprints` | Plural — consistent with `apps/projects` |
| `apps/workflow/` | `workflow` | Singular — matches ARCHITECTURE_RULES and arch tests |

Do **not** create `apps/issue/` (singular) or `apps/workflows/` (plural) in Phase 3.

### Layering (unchanged)

```text
Service  → writes, orchestration, validation beyond serializer
Selector → read-only queries, projections (backlog, kanban, lists)
API      → thin views (≤15 logic lines), serializers, envelope
Contracts → DTOs + narrow read interfaces; no ORM leakage
```

### Cross-module communication

```text
apps/projects      ──project_contract, membership_contract──►  issues, sprints, workflow
apps/issues        ──issue_contract──►  sprints (counts), workflow (apply_status_change)
apps/sprints       ──sprint_contract──►  issues (bulk sprint_id updates via issue_contract)
apps/workflow      ──workflow_contract──►  issues (transition validation + status apply)
all modules        ──permission_contract──►  permissions.PermissionService (full impl Phase 3)
```

**Forbidden:** `from apps.issues.models import Issue` inside `apps/sprints/`.

### Transition flow (locked)

```text
POST /api/issues/{id}/transition
  → issues.api (facade view)
  → workflow.services.TransitionService.transition()
      → permission_contract.can_transition_issue()
      → workflow_contract.is_valid_transition()
      → issue_contract.apply_status_change()
```

No `POST /board/move`, no transition logic in `sprints` or `issues` services beyond the facade delegation.

### Board / Kanban in Phase 3

ARCHITECTURE_RULES defines `apps/board/` as a future read-only projection module. **Phase 3 delivers kanban data via issues selectors** at `GET /api/projects/{id}/kanban` and `GET /api/projects/{id}/sprints/{sid}/board`. Extract to `apps/board/` in a later phase without API contract change.

---

## 2. Entity Relationship Diagram

```text
┌─────────────┐       ┌────────────────────┐       ┌──────────────┐
│    User     │◄──────│ OrganizationMember │──────►│ Organization │
│ (accounts)  │       └────────────────────┘       └──────┬───────┘
└──────┬──────┘                                             │
       │              ┌────────────────────┐               │
       └──────────────│   ProjectMember    │               │
                      └─────────┬──────────┘               │
                                │                          │
                      ┌─────────▼──────────┐       ┌───────▼────────┐
                      │      Project       │◄──────│  (org FK)      │
                      │  key (HRMS)        │       └────────────────┘
                      │  next_issue_number │
                      └─────────┬──────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
┌────────▼────────┐   ┌─────────▼─────────┐   ┌───────▼──────────────┐
│ WorkflowStatus  │   │      Sprint        │   │        Issue         │
│ (per project)   │   │  status: planned|  │   │  key: HRMS-42        │
│ slug: todo,     │   │    active|completed│   │  sprint_id nullable  │
│  in_progress…   │   │  UNIQUE active per │   │  parent_issue (self) │
└────────┬────────┘   │  project (active)  │   │  status → WorkflowSt.│
         │            └─────────┬─────────┘   │  position (ordering) │
┌────────▼────────┐             │             └──────────────────────┘
│WorkflowTransition│             └──── sprint_id (nullable = backlog)
│ from_status     │
│ to_status       │
└─────────────────┘
```

### Cardinality rules (locked)

| Relationship | Cardinality | Constraint |
|--------------|-------------|------------|
| Project → Issue | One-to-many | `Issue.project_id` required |
| Project → Sprint | One-to-many | `Sprint.project_id` required |
| Project → WorkflowStatus | One-to-many | Seeded on project create; frozen set Phase 3 |
| Sprint → Issue | One-to-many (optional) | `Issue.sprint_id` nullable — null = backlog |
| Issue → Issue (parent) | One-to-many | `parent_issue_id` nullable — subtasks only |
| Project active sprint | **At most one** | `Sprint.status=active` unique per project |
| Issue key | **Unique globally** | `UNIQUE(key)` — `HRMS-42` is globally unique because project key is per-org unique and number is per-project |

---

## 3. Frozen Architecture Decisions

### A. Issue Entity

#### Issue model fields (locked)

```text
Issue
    id              UUID PK
    project         FK(Project), PROTECT
    number          PositiveIntegerField — per-project sequence
    key             CharField — denormalized "{project.key}-{number}"; UNIQUE globally
    title           CharField(500)
    description     TextField, blank=True
    status          FK(WorkflowStatus), PROTECT — current workflow column
    priority        lowest | low | medium | high | highest
    issue_type      task | bug | subtask
    reporter        FK(User), PROTECT
    assignee        FK(User), SET_NULL nullable
    sprint          FK(Sprint), SET_NULL nullable — null = backlog
    parent_issue    FK(self), SET_NULL nullable — subtask parent
    story_points    PositiveSmallIntegerField nullable
    due_date        DateField nullable
    labels          JSONField default [] — list of strings (no Label model Phase 3)
    position        DecimalField(12,4) default 0 — ordering within status column scope
    created_by      FK(User), SET_NULL nullable
    updated_by      FK(User), SET_NULL nullable
    created_at, updated_at (foundation.BaseModel)
    UNIQUE(project_id, number)
    UNIQUE(key)
    INDEX(project, sprint, status, position)
    INDEX(project, status, position) WHERE sprint IS NULL — backlog kanban
```

#### Issue numbering strategy (locked)

| Rule | Value |
|------|-------|
| Counter storage | `Project.next_issue_number` — `PositiveIntegerField default 0` |
| Allocation | **Atomic increment** in `issue_service.create` inside `transaction.atomic()` with `select_for_update()` on Project |
| Key format | `{project.key}-{number}` — e.g. `HRMS-1`, `HRMS-42` |
| Number immutability | **Immutable** after create |
| Key immutability | **Immutable** after create |
| First issue | `number=1` after increment from 0 |
| Collision handling | DB `UNIQUE(project_id, number)` + `UNIQUE(key)` — service never reuses numbers |

**Rejected:** UUID-based keys (poor UX for internal Jira-like tool). **Rejected:** Global counter across org (breaks project key semantics).

#### Project-scoped keys (locked)

- Human-readable key uses **Phase 2 `Project.key`** prefix (e.g. `HRMS`).
- Uniqueness scope: numbers are per-project; full key string is globally unique in practice.
- API accepts **no client-supplied key** — server generates from project key + counter.

#### Parent / subtask behavior (locked)

| Rule | Value |
|------|-------|
| Depth | **One level only** — subtask → parent task; no subtask-of-subtask |
| `issue_type=subtask` | Requires `parent_issue_id` |
| `issue_type=task\|bug` | `parent_issue_id` must be null |
| Project consistency | Subtask `project_id` must equal parent `project_id` |
| Status independence | Subtask has **own** `status` — not derived from parent |
| Sprint default | Subtask may be in same sprint as parent or backlog; **not auto-synced** on parent sprint change |
| Parent deletion | **Forbidden** if open subtasks exist — return `409` |
| Subtask in Phase 3 | Create/update/list only — no separate subtask API module |

#### Backlog vs sprint (locked)

| State | Definition |
|-------|------------|
| **Backlog** | `sprint_id IS NULL` |
| **Sprint-assigned** | `sprint_id` set to a `Sprint` row |

| Rule | Value |
|------|-------|
| Add to sprint | Sets `sprint_id`; target sprint must be `planned` or `active` |
| Remove from sprint | Sets `sprint_id=NULL` — returns to backlog |
| Completed sprint issues | Remain linked until moved — **not auto-cleared** on sprint complete |
| Active sprint | Issues in `active` sprint are sprint board scope |
| Planned sprint | Issues may be pre-assigned during planning |

#### Kanban ordering (locked)

| Rule | Value |
|------|-------|
| Order field | `position` — `DecimalField(12,4)` |
| Scope | Unique ordering within `(project_id, status_id, sprint_id_or_backlog)` |
| Reorder API | `PATCH /api/issues/{id}` with `position` (+ optional `status_id` via transition endpoint, not PATCH) |
| Default on create | `max(position) + 1000` in scope — gaps allow insert-between |
| Drag-drop | Frontend sends transition + position update; status change **only** via `POST .../transition` |
| Backlog kanban | `GET .../kanban?scope=backlog` groups by `status_id` where `sprint_id IS NULL` |
| Sprint kanban | `GET .../sprints/{sid}/board` groups by `status_id` where `sprint_id=sid` |

#### Priority enum (locked)

```text
lowest | low | medium | high | highest
```

Default: `medium`.

#### Issue type enum (locked)

```text
task | bug | subtask
```

Default: `task`.

---

### B. Sprint Entity

#### Sprint model fields (locked)

```text
Sprint
    id              UUID PK
    project         FK(Project), PROTECT
    name            CharField(255)
    goal            TextField, blank=True
    status          planned | active | completed
    start_date      DateField nullable
    end_date        DateField nullable
    started_at      DateTimeField nullable
    completed_at    DateTimeField nullable
    created_by      FK(User), SET_NULL nullable
    created_at, updated_at (foundation.BaseModel)
    INDEX(project, status)
```

#### Sprint status enum (locked)

```text
planned | active | completed
```

| Status | Meaning |
|--------|---------|
| `planned` | Created, not started; accepts issue assignment |
| `active` | Started; **at most one per project** |
| `completed` | Closed; read-only; no new issue assignment |

#### One active sprint per project (locked)

**YES — at most one `active` sprint per project.**

| Rule | Value |
|------|-------|
| Start guard | `start_sprint` fails with `409` if another sprint is `active` |
| Enforcement | Partial unique constraint or service check: one `active` per `project_id` |
| Internal deploy | Matches Jira-style team workflow; simplifies board and metrics |
| Future | Parallel sprints deferred — schema does not block, rule is service-level |

**Rejected:** Unlimited active sprints — unnecessary complexity for internal Phase 3.

#### Backlog handling (locked)

- Backlog is **not a sprint** — it is `Issue.sprint_id IS NULL`.
- No `Backlog` model.
- `GET /api/projects/{id}/backlog` returns issues where `sprint_id IS NULL`, ordered by `position` then `created_at`.

#### Incomplete issue carry-forward (locked)

On `POST .../sprints/{sid}/complete`, client supplies carry-forward intent:

```json
{
  "move_incomplete_to": "backlog",
  "target_sprint_id": null
}
```

or

```json
{
  "move_incomplete_to": "sprint",
  "target_sprint_id": "uuid-of-planned-sprint"
}
```

| Rule | Value |
|------|-------|
| Incomplete definition | Issues in sprint where `status.category != done` |
| `done` category | WorkflowStatus with `category=done` (only `done` slug in frozen set) |
| Default if omitted | `move_incomplete_to=backlog` |
| Target sprint | Must be same project, `status=planned` |
| Completed issues | Stay in completed sprint (historical record) |
| Audit | `completed_at` set; sprint becomes read-only |

---

### C. Workflow Entity (frozen system)

Phase 3 ships a **single frozen workflow** per project. No custom workflow editor. Seeded automatically when a project is created (hook in `project_service.create` or post-create signal via contract).

#### WorkflowStatus model (locked)

```text
WorkflowStatus
    id              UUID PK
    project         FK(Project), CASCADE
    slug            CharField — machine key (todo, in_progress, …)
    name            CharField — display label
    category        todo | in_progress | in_review | done | blocked
    order           PositiveSmallIntegerField — column order left-to-right
    UNIQUE(project_id, slug)
```

#### Frozen statuses per project (locked)

| slug | name | category | order |
|------|------|----------|-------|
| `todo` | To Do | `todo` | 1 |
| `in_progress` | In Progress | `in_progress` | 2 |
| `in_review` | In Review | `in_review` | 3 |
| `done` | Done | `done` | 4 |
| `blocked` | Blocked | `blocked` | 5 |

`blocked` renders as its own column in Kanban (not a sidebar state).

#### WorkflowTransition model (locked)

```text
WorkflowTransition
    id              UUID PK
    project         FK(Project), CASCADE
    from_status     FK(WorkflowStatus), CASCADE
    to_status       FK(WorkflowStatus), CASCADE
    name            CharField — e.g. "Start Progress"
    slug            CharField — machine key
    UNIQUE(project_id, from_status_id, to_status_id)
```

#### Frozen transitions (locked)

| from | to | slug | name |
|------|-----|------|------|
| `todo` | `in_progress` | `start` | Start Progress |
| `in_progress` | `in_review` | `submit_review` | Submit for Review |
| `in_review` | `done` | `approve` | Mark Done |
| `done` | `todo` | `reopen` | Reopen |
| `todo` | `blocked` | `block_from_todo` | Block |
| `in_progress` | `blocked` | `block_from_progress` | Block |
| `in_review` | `blocked` | `block_from_review` | Block |
| `blocked` | `todo` | `unblock_to_todo` | Unblock → To Do |
| `blocked` | `in_progress` | `unblock_to_progress` | Unblock → In Progress |
| `in_review` | `in_progress` | `request_changes` | Request Changes |

`request_changes` supports QA/developer rework loop (in_review → in_progress).

**No** `done → in_progress` direct transition — must `reopen` to `todo` first.

#### Transition role permissions (locked)

Authorization via `PermissionService.can_transition_issue(user_id, issue_id, target_status_id)` using **project role + transition slug**.

| Transition slugs | project_admin | project_manager | developer | qa | viewer |
|------------------|:-------------:|:---------------:|:---------:|:--:|:------:|
| `start` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `submit_review` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `request_changes` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `approve` | ✓ | ✓ | ✗ | ✓ | ✗ |
| `reopen` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `block_from_*` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `unblock_to_*` | ✓ | ✓ | ✓ | ✓ | ✗ |

| Rule | Value |
|------|-------|
| `approve` (→ done) | **QA and managers only** — developers cannot close |
| `reopen` | **Managers and admins only** |
| `viewer` | **No transitions** |
| Assignee check | **Not required Phase 3** — any member with role permission may transition any visible issue |
| Archived project | All mutations return `403` |

---

### D. PermissionService Phase 3 (full implementation)

Phase 3 **implements** the role-permission matrix for issues and sprints. Extends Phase 2 methods (org/project) without breaking signatures.

#### New frozen method signatures

```text
can_create_issue(user_id, project_id) -> bool
can_edit_issue(user_id, issue_id) -> bool
can_assign_issue(user_id, issue_id) -> bool
can_transition_issue(user_id, issue_id, target_status_id) -> bool
can_manage_sprint(user_id, project_id) -> bool
can_plan_sprint(user_id, project_id) -> bool
```

#### Existing methods — Phase 3 behavior update

```text
can_manage_workflow(user_id, project_id) -> bool   # True for project_admin only; config API out of scope
can_view_issue(user_id, issue_id) -> bool          # implement: project visibility + membership
can_view_sprint(user_id, sprint_id) -> bool        # implement: via project access
can_start_sprint(user_id, sprint_id) -> bool       # alias: can_manage_sprint + sprint is planned
can_complete_sprint(user_id, sprint_id) -> bool    # alias: can_manage_sprint + sprint is active
```

#### Role matrix (locked)

| Method | project_admin | project_manager | developer | qa | viewer |
|--------|:-------------:|:---------------:|:---------:|:--:|:------:|
| `can_create_issue` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `can_edit_issue` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `can_assign_issue` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `can_manage_sprint` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `can_plan_sprint` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `can_transition_issue` | per transition table | per transition table | per transition table | per transition table | ✗ |
| `can_manage_workflow` | ✓ | ✗ | ✗ | ✗ | ✗ |

| Rule | Value |
|------|-------|
| Base gate | Caller must `can_view_project` first |
| Archived project | All write permissions return `False` |
| Inline role checks | **Forbidden** in views/services |
| Org role inheritance | **None** — project role only |

Update `apps/contracts/permission_contract.py` Protocol and `ARCHITECTURE_RULES.md` catalog before implementation.

---

### E. Contracts-First Boundaries

Define/update in `apps/contracts/` **before** implementing each slice.

#### `issue_contract.py` (extend)

```text
IssueSummaryDTO(id, key, title, status_slug, priority, issue_type, assignee_id, sprint_id, position)
IssueDetailDTO(id, key, title, description, status_id, status_slug, project_id, priority, issue_type,
               reporter_id, assignee_id, sprint_id, parent_issue_id, story_points, due_date, labels,
               position, created_at, updated_at)
IssueBoardColumnDTO(status_slug, status_name, order, issues: list[IssueSummaryDTO])
IssueKanbanDTO(project_id, sprint_id?, columns: list[IssueBoardColumnDTO])

get_issue_by_id(issue_id) -> IssueDetailDTO | None
get_issues_for_project(project_id, *, sprint_id?, backlog_only?, status_slug?) -> list[IssueSummaryDTO]
get_backlog_issues(project_id) -> list[IssueSummaryDTO]
get_kanban_board(project_id, sprint_id?) -> IssueKanbanDTO
get_sprint_issues(sprint_id) -> list[IssueSummaryDTO]
apply_status_change(issue_id, target_status_id, actor_id) -> None
bulk_set_sprint(issue_ids, sprint_id?, actor_id) -> int
```

#### `sprint_contract.py` (extend)

```text
SprintDetailDTO(id, project_id, name, goal, status, start_date, end_date, started_at, completed_at, issue_count)
SprintSummaryDTO(id, project_id, name, status, start_date, end_date, issue_count)

get_active_sprint(project_id) -> SprintSummaryDTO | None
get_sprint_by_id(sprint_id) -> SprintDetailDTO | None
get_sprint_summary(sprint_id) -> SprintSummaryDTO | None
list_sprints_for_project(project_id, *, status?) -> list[SprintSummaryDTO]
```

#### `workflow_contract.py` (extend)

```text
WorkflowStatusDTO(id, slug, name, category, order)
WorkflowTransitionDTO(id, from_status_slug, to_status_slug, slug, name)
WorkflowConfigDTO(project_id, statuses, transitions)

get_workflow_config(project_id) -> WorkflowConfigDTO
get_status_by_slug(project_id, slug) -> WorkflowStatusDTO | None
is_valid_transition(project_id, from_status_id, to_status_id) -> bool
get_allowed_transitions(project_id, from_status_id) -> list[WorkflowTransitionDTO]
seed_default_workflow(project_id) -> None
```

#### `project_contract.py` (extend)

```text
ProjectSummaryDTO — populate open_issue_count, active_sprint_id from Phase 3 selectors
increment_issue_number(project_id) -> int   # internal; used by issue_service via contract
```

DTO rule: **frozen dataclasses only** — no ORM across boundaries.

---

### F. API Planning (frozen surface)

**URL prefix:** `/api/` (no `/api/v1/`).  
**Envelope:** `apps/foundation/responses.py`.

#### Issue APIs

| Method | Path | Owner | Permission |
|--------|------|-------|------------|
| GET | `/api/projects/{project_id}/issues/` | issues selectors | `can_view_project` |
| POST | `/api/projects/{project_id}/issues/` | `issue_service.create` | `can_create_issue` |
| GET | `/api/issues/{issue_id}/` | issues selectors | `can_view_issue` |
| PATCH | `/api/issues/{issue_id}/` | `issue_service.update` | `can_edit_issue` |
| POST | `/api/issues/{issue_id}/assign` | `issue_service.assign` | `can_assign_issue` |
| POST | `/api/issues/{issue_id}/transition` | `TransitionService` via facade | `can_transition_issue` |
| POST | `/api/issues/{issue_id}/move-sprint` | `issue_service.move_sprint` | `can_plan_sprint` |
| GET | `/api/projects/{project_id}/backlog/` | issues selectors | `can_view_project` |
| GET | `/api/projects/{project_id}/kanban/` | issues selectors | `can_view_project` |
| GET | `/api/projects/{project_id}/sprints/{sprint_id}/board` | issues selectors | `can_view_sprint` |

**Query params (list/backlog):** `status`, `priority`, `issue_type`, `assignee_id`, `search` (title contains).

**POST create issue:**

```json
{
  "title": "Implement login API",
  "description": "",
  "issue_type": "task",
  "priority": "medium",
  "assignee_id": null,
  "sprint_id": null,
  "parent_issue_id": null,
  "story_points": 3,
  "due_date": "2026-06-30",
  "labels": ["backend"]
}
```

**POST assign:**

```json
{ "assignee_id": "uuid" }
```

`assignee_id: null` unassigns.

**POST transition:**

```json
{ "target_status_id": "uuid" }
```

Alternative (optional): `{ "transition_slug": "start" }` — resolve to `target_status_id` server-side.

**POST move-sprint:**

```json
{ "sprint_id": "uuid" }
```

`sprint_id: null` moves to backlog.

**GET kanban query:** `?scope=backlog` or `?sprint_id={uuid}`.

#### Sprint APIs

| Method | Path | Owner | Permission |
|--------|------|-------|------------|
| GET | `/api/projects/{project_id}/sprints/` | sprints selectors | `can_view_project` |
| POST | `/api/projects/{project_id}/sprints/` | `sprint_service.create` | `can_manage_sprint` |
| GET | `/api/projects/{project_id}/sprints/{sprint_id}/` | sprints selectors | `can_view_sprint` |
| PATCH | `/api/projects/{project_id}/sprints/{sprint_id}/` | `sprint_service.update` | `can_manage_sprint` |
| POST | `/api/projects/{project_id}/sprints/{sprint_id}/start` | `sprint_service.start` | `can_manage_sprint` |
| POST | `/api/projects/{project_id}/sprints/{sprint_id}/complete` | `sprint_service.complete` | `can_manage_sprint` |
| POST | `/api/projects/{project_id}/sprints/{sprint_id}/issues/move` | `sprint_service.move_issues` | `can_plan_sprint` |

**POST create sprint:**

```json
{
  "name": "Sprint 1",
  "goal": "Auth and project shell",
  "start_date": "2026-06-10",
  "end_date": "2026-06-24"
}
```

**POST complete sprint:**

```json
{
  "move_incomplete_to": "backlog",
  "target_sprint_id": null
}
```

**POST move issues (bulk):**

```json
{
  "issue_ids": ["uuid", "uuid"],
  "sprint_id": "uuid"
}
```

`sprint_id: null` → backlog.

#### Workflow API (read-only Phase 3)

| Method | Path | Owner | Permission |
|--------|------|-------|------------|
| GET | `/api/projects/{project_id}/workflow/` | workflow selectors | `can_view_project` |

Returns frozen statuses + transitions for UI transition picker.

#### Response shape example — GET issue

```json
{
  "success": true,
  "message": "",
  "data": {
    "issue": {
      "id": "uuid",
      "key": "HRMS-42",
      "title": "Implement login API",
      "description": "",
      "status": { "id": "uuid", "slug": "in_progress", "name": "In Progress" },
      "priority": "medium",
      "issue_type": "task",
      "reporter": { "id": "uuid", "display_name": "Jane" },
      "assignee": null,
      "sprint_id": null,
      "parent_issue_id": null,
      "story_points": 3,
      "due_date": "2026-06-30",
      "labels": ["backend"],
      "position": "1000.0000",
      "created_at": "2026-06-05T00:00:00Z",
      "updated_at": "2026-06-05T00:00:00Z"
    }
  }
}
```

#### Error codes (locked)

| Code | Condition |
|------|-----------|
| `400` | Validation; invalid transition; subtask without parent; parent project mismatch |
| `403` | Permission denied; archived project mutation |
| `404` | Issue/sprint/status not found |
| `409` | Active sprint already exists; duplicate start; parent has subtasks on delete; issue in completed sprint |

---

## 4. App Structure (implementation reference)

### `apps/issues/`

```text
apps/issues/
  models/
    issue.py
  services/
    issue_service.py      # create, update, assign, move_sprint
    transition_facade.py  # thin delegate to TransitionService (optional)
  selectors.py            # list, detail, backlog, kanban
  api/
    serializers.py
    views.py
    urls.py
  tests/
    test_issue_crud.py
    test_backlog_kanban.py
    test_assign.py
  admin.py
```

### `apps/sprints/`

```text
apps/sprints/
  models/
    sprint.py
  services/
    sprint_service.py     # create, update, start, complete, move_issues
  selectors.py
  api/
    serializers.py
    views.py
    urls.py
  tests/
    test_sprint_lifecycle.py
    test_carry_forward.py
  admin.py
```

### `apps/workflow/`

```text
apps/workflow/
  models/
    status.py
    transition.py
  services/
    transition_service.py # sole transition authority
    seed_service.py       # seed_default_workflow
  selectors.py
  api/
    serializers.py
    views.py              # GET workflow config only
    urls.py
  tests/
    test_transitions.py
    test_seed.py
  admin.py
```

### `apps/permissions/` (extend)

```text
apps/permissions/
  services/
    permission_service.py  # full issue/sprint matrix
  tests/
    test_issue_permissions.py
    test_sprint_permissions.py
```

---

## 5. Slice-by-Slice Implementation Plan

Implement strictly in order. One slice per PR/session.

| # | Slice | Scope |
|---|-------|-------|
| 1 | **Module layout & settings** | Create `apps/sprints`, `apps/workflow`; restructure `apps/issues`; register URLs; `INSTALLED_APPS`; extend `Project.next_issue_number` migration |
| 2 | **Models & migrations** | Issue, Sprint, WorkflowStatus, WorkflowTransition; constraints, indexes; admin |
| 3 | **Contracts** | Extend issue, sprint, workflow, permission, project contracts; wire stubs |
| 4 | **Workflow seed & TransitionService** | `seed_default_workflow` on project create; `TransitionService`; arch test path satisfied |
| 5 | **PermissionService full impl** | Six new methods + transition matrix + update Phase 2 methods for archived projects |
| 6 | **Selectors** | Backlog, kanban, issue list/detail, sprint list/detail; populate `ProjectSummaryDTO` counts |
| 7 | **Services** | `issue_service`, `sprint_service`; atomic issue numbering; carry-forward on complete |
| 8 | **API layer** | Frozen endpoints; thin views; transition facade |
| 9 | **Tests & hardening** | Full test matrix; architecture tests; README endpoint table; seed workflow for existing projects command |

### Bootstrap note

Add management command `seed_project_workflows` — idempotent seed for projects created before Phase 3.

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Race on issue numbering | Duplicate keys | `select_for_update` on Project; `UNIQUE(project_id, number)` |
| Transition logic drift | Multiple mutation paths | Single `TransitionService`; arch test; single API endpoint |
| Active sprint collision | Two active sprints | Service guard + DB partial unique index where supported |
| Carry-forward data loss | Issues stranded in completed sprint | Explicit `complete` payload; default to backlog |
| Permission matrix complexity | Wrong access | Centralize in `PermissionService`; table-driven transition rules |
| Existing projects without workflow | Transition failures | `seed_project_workflows` command; hook on project create |
| Subtask orphan rules | Invalid trees | Service validates parent project/type; max depth 1 |
| Kanban ordering conflicts | Duplicate positions | Decimal gaps; PATCH position idempotent |
| Phase 2 archived projects | Mutations on dead projects | All write services check `project.status=active` |
| `apps/issues` vs ARCHITECTURE_RULES `issue` naming | Doc drift | Freeze plural `issues`; update ARCHITECTURE_RULES references in Slice 1 |
| Labels as JSON | No label catalog | Acceptable Phase 3; replace with Label model in future phase |

---

## 7. Explicitly Out of Scope (Phase 3)

- Epics, roadmaps, versions, releases
- Time tracking, estimates (beyond `story_points` field storage)
- Attachments, comments, watchers, mentions
- Notifications, activity feeds, audit history
- Automation rules, webhooks
- Custom workflows, status editor, transition editor
- AI planning / sprint suggestions
- `apps/board/` module (kanban via issues selectors; extract later)
- `apps/mytasks/` module
- Bulk transition API
- Issue linking (blocks/is blocked by)
- Hard delete for issues or sprints (soft cancel deferred)
- Global cross-project issue search
- Saved filters, favorites

---

## 8. Testing Plan (for implementation)

| Area | Tests |
|------|-------|
| Issue create | Key generation `HRMS-1`; atomic counter; defaults |
| Issue CRUD | patch title, priority, labels, story_points |
| Subtask rules | requires parent; same project; depth limit |
| Assign | permission by role; unassign |
| Transition | valid/invalid paths; role matrix; `approve` denied for developer |
| Backlog | `sprint_id null` listed; move in/out |
| Kanban | columns ordered by workflow; issues grouped by status |
| Sprint lifecycle | create planned → start → complete; one active guard |
| Carry-forward | incomplete → backlog; incomplete → planned sprint |
| Bulk move | `move_issues` permission; completed sprint rejected |
| Workflow seed | new project has 5 statuses + transitions |
| Permissions | full matrix per role; viewer read-only |
| Archived project | all writes 403 |
| Contracts | DTO-only returns |
| Architecture | import boundaries; thin views; transition centralization |

---

## 9. Change Control

1. Phase 3 implementation **must not** modify Phase 1 or Phase 2 freeze decisions without explicit approval.
2. Any scope or API change requires updating `.cursor/freeze/phase-3-freeze.md`.
3. Run `.cursor/checklists/phase-3-checklist.md` before every Phase 3 PR merge.
4. Add new `PermissionService` methods to `ARCHITECTURE_RULES.md` before use.

**Phase 3 is complete when:** all nine slices merged, checklist passes, `seed_project_workflows` validated, and frozen endpoints match freeze doc.

---

## Key Alignment Notes

| Topic | Decision |
|-------|----------|
| Workflow app | **`apps/workflow/`** separate — not inside issues |
| Issue app | **`apps/issues/`** (plural) |
| Sprint app | **`apps/sprints/`** (plural) |
| Transition authority | `workflow.TransitionService` only |
| Transition API | `POST /api/issues/{id}/transition` only |
| Issue keys | Server-generated `{PROJECT_KEY}-{number}` |
| Backlog | `sprint_id IS NULL` — not a model |
| Active sprint | At most one per project |
| Workflow | Frozen 5 statuses + 10 transitions; seeded per project |
| PermissionService | Full implementation for issue/sprint permissions |
| Labels | JSON string list — no Label model |
| Board module | Deferred — kanban via issues selectors |
