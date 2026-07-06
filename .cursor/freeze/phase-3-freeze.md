# Phase 3 Freeze — Issues + Sprints + Workflow Foundation

**Status:** LOCKED  
**Effective:** Phase 3 start → Phase 3 complete  
**Authority:** Single source of truth for Phase 3 decisions. Treat as immutable unless explicitly approved.

> Do not change architecture, scope, or API contracts during Phase 3 implementation without explicit approval and an update to this file.

**Prerequisites (immutable):**

- `.cursor/freeze/phase-1-freeze.md` — auth + identity decisions
- `.cursor/freeze/phase-2-freeze.md` — organization + project foundation
- `.cursor/plans/ARCHITECTURE_RULES.md` — global backend rules

**Related documents (subordinate to this freeze):**

- `.cursor/plans/phase-3-issues-sprints.md` — detailed planning reference
- `.cursor/checklists/phase-3-checklist.md` — per-PR enforcement checklist

---

## Architecture

| Decision | Locked value |
|----------|--------------|
| Domain apps | **`apps/issues`** + **`apps/sprints`** + **`apps/workflow`** |
| Workflow location | **`apps/workflow`** — **NOT** embedded in `apps/issues` |
| Forbidden apps | **No `apps/board/`** persistence in Phase 3 · **No `apps/mytasks/`** · **No `apps/workflows/`** (use singular `workflow`) |
| Layering | **Service → Selector → API** |
| Views | **Thin views only** (≤15 logic lines per method) |
| Cross-module boundary | **Contracts-only** via `apps/contracts/` |
| Transition authority | **`workflow.services.TransitionService`** — sole transition logic |
| Transition API | **`POST /api/issues/{id}/transition` only** — no alternate endpoints |
| Permission authority | **`permissions.services.PermissionService`** — **full implementation** for issue/sprint perms |
| Inline role checks | **Forbidden** in views and services |

### App layout (locked)

```text
apps/issues/     models/issue.py; issue_service; selectors; api/
apps/sprints/    models/sprint.py; sprint_service; selectors; api/
apps/workflow/   models/status.py, transition.py; transition_service; seed_service; api/ (read-only)
```

---

## Workflow Decision

| Decision | Locked value |
|----------|--------------|
| Workflow module | **`apps/workflow/`** (separate app) |
| Custom workflows | **Forbidden** in Phase 3 — frozen default only |
| Seed trigger | **On project create** — every project gets identical workflow |
| Status editor API | **Out of scope** — `GET` config only |

---

## Issue Strategy

### Issue model (locked fields)

```text
Issue
    id              UUID PK
    project         FK(Project), PROTECT
    number          PositiveIntegerField — per-project sequence
    key             CharField — "{project.key}-{number}"; UNIQUE globally
    title           CharField(500)
    description     TextField, blank=True
    status          FK(WorkflowStatus), PROTECT
    priority        lowest | low | medium | high | highest
    issue_type      task | bug | subtask
    reporter        FK(User), PROTECT
    assignee        FK(User), SET_NULL nullable
    sprint          FK(Sprint), SET_NULL nullable — null = backlog
    parent_issue    FK(self), SET_NULL nullable
    story_points    PositiveSmallIntegerField nullable
    due_date        DateField nullable
    labels          JSONField default [] — list of strings
    position        DecimalField(12,4) default 0
    created_by      FK(User), SET_NULL nullable
    updated_by      FK(User), SET_NULL nullable
    created_at, updated_at (foundation.BaseModel)
    UNIQUE(project_id, number)
    UNIQUE(key)
```

### Issue numbering (locked)

| Rule | Value |
|------|-------|
| Counter | `Project.next_issue_number` — incremented atomically (`select_for_update`) |
| Key format | `{PROJECT_KEY}-{number}` — e.g. `HRMS-42` |
| Client supplies key | **No** — server-generated only |
| Immutability | `number` and `key` **immutable** after create |

### Parent / subtask (locked)

| Rule | Value |
|------|-------|
| Depth | **One level** — task/bug → subtask only |
| `issue_type=subtask` | Requires `parent_issue_id` |
| `issue_type=task\|bug` | `parent_issue_id` must be null |
| Project match | Subtask `project_id` must equal parent `project_id` |
| Sprint sync | **No auto-sync** between parent and subtask sprint |

### Backlog vs sprint (locked)

| State | Definition |
|-------|------------|
| Backlog | `sprint_id IS NULL` |
| Sprint-assigned | `sprint_id` references a Sprint |

### Kanban ordering (locked)

| Rule | Value |
|------|-------|
| Order field | `position` — `DecimalField(12,4)` |
| Scope | Within `(project_id, status_id, sprint_id or backlog)` |
| Status change | **Only** via `POST /api/issues/{id}/transition` — not PATCH |

### Priority enum (locked)

```text
lowest | low | medium | high | highest
```

Default: `medium`.

### Issue type enum (locked)

```text
task | bug | subtask
```

Default: `task`.

---

## Sprint Strategy

### Sprint model (locked fields)

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
```

### Sprint status enum (locked)

```text
planned | active | completed
```

### Sprint rules (locked)

| Rule | Value |
|------|-------|
| One active sprint | **At most one** `active` sprint per project |
| Start guard | `409` if another sprint is already `active` |
| Backlog | **Not a sprint** — issues with `sprint_id=NULL` |
| Assign to sprint | Target sprint must be `planned` or `active` |
| Completed sprint | **Read-only** — no new issue assignment |
| Incomplete carry-forward | On complete: client chooses `backlog` or `planned` sprint target |
| Default carry-forward | `move_incomplete_to=backlog` |
| Incomplete definition | Issues where status `category != done` |

---

## Workflow Strategy (frozen system)

### WorkflowStatus (locked fields)

```text
WorkflowStatus
    id              UUID PK
    project         FK(Project), CASCADE
    slug            CharField — todo | in_progress | in_review | done | blocked
    name            CharField — display label
    category        todo | in_progress | in_review | done | blocked
    order           PositiveSmallIntegerField
    UNIQUE(project_id, slug)
```

### Frozen statuses (locked — per project)

| slug | name | category | order |
|------|------|----------|-------|
| `todo` | To Do | `todo` | 1 |
| `in_progress` | In Progress | `in_progress` | 2 |
| `in_review` | In Review | `in_review` | 3 |
| `done` | Done | `done` | 4 |
| `blocked` | Blocked | `blocked` | 5 |

### WorkflowTransition (locked fields)

```text
WorkflowTransition
    id              UUID PK
    project         FK(Project), CASCADE
    from_status     FK(WorkflowStatus), CASCADE
    to_status       FK(WorkflowStatus), CASCADE
    name            CharField
    slug            CharField
    UNIQUE(project_id, from_status_id, to_status_id)
```

### Frozen transitions (locked)

| from | to | slug |
|------|-----|------|
| `todo` | `in_progress` | `start` |
| `in_progress` | `in_review` | `submit_review` |
| `in_review` | `done` | `approve` |
| `done` | `todo` | `reopen` |
| `todo` | `blocked` | `block_from_todo` |
| `in_progress` | `blocked` | `block_from_progress` |
| `in_review` | `blocked` | `block_from_review` |
| `blocked` | `todo` | `unblock_to_todo` |
| `blocked` | `in_progress` | `unblock_to_progress` |
| `in_review` | `in_progress` | `request_changes` |

### Transition role permissions (locked)

| Transition slugs | project_admin | project_manager | developer | qa | viewer |
|------------------|:-------------:|:---------------:|:---------:|:--:|:------:|
| `start`, `submit_review`, `request_changes` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `approve` | ✓ | ✓ | ✗ | ✓ | ✗ |
| `reopen` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `block_from_*`, `unblock_to_*` | ✓ | ✓ | ✓ | ✓ | ✗ |

---

## PermissionService Phase 3 (full implementation)

### New frozen method signatures

```text
can_create_issue(user_id, project_id) -> bool
can_edit_issue(user_id, issue_id) -> bool
can_assign_issue(user_id, issue_id) -> bool
can_transition_issue(user_id, issue_id, target_status_id) -> bool
can_manage_sprint(user_id, project_id) -> bool
can_plan_sprint(user_id, project_id) -> bool
```

### Role matrix (locked)

| Method | project_admin | project_manager | developer | qa | viewer |
|--------|:-------------:|:---------------:|:---------:|:--:|:------:|
| `can_create_issue` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `can_edit_issue` | ✓ | ✓ | ✓ | ✓ | ✗ |
| `can_assign_issue` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `can_manage_sprint` | ✓ | ✓ | ✗ | ✗ | ✗ |
| `can_plan_sprint` | ✓ | ✓ | ✓ | ✗ | ✗ |
| `can_manage_workflow` | ✓ | ✗ | ✗ | ✗ | ✗ |
| `can_transition_issue` | per transition table | per transition table | per transition table | per transition table | ✗ |

| Rule | Value |
|------|-------|
| Base gate | `can_view_project` required for all issue/sprint actions |
| Archived project | All write permissions return `False` |
| Inline role checks | **Forbidden** |

Update `apps/contracts/permission_contract.py` Protocol before implementation.

---

## Contracts (locked)

| File | Status |
|------|--------|
| `issue_contract.py` | **Extend** — DTOs + read/write interfaces |
| `sprint_contract.py` | **Extend** — DTOs + read interfaces |
| `workflow_contract.py` | **Extend** — config + validation interfaces |
| `permission_contract.py` | **Extend** — six new methods |
| `project_contract.py` | **Extend** — `open_issue_count`, `active_sprint_id`, issue counter |

**DTO rule:** Frozen dataclasses only — **no ORM instances** cross module boundaries.

---

## API Surface (locked)

**Prefix:** `/api/` (no `/api/v1/`).  
**Envelope:** `apps/foundation/responses.py`.

### Issue endpoints

| Method | Path |
|--------|------|
| GET | `/api/projects/{project_id}/issues/` |
| POST | `/api/projects/{project_id}/issues/` |
| GET | `/api/issues/{issue_id}/` |
| PATCH | `/api/issues/{issue_id}/` |
| POST | `/api/issues/{issue_id}/assign` |
| POST | `/api/issues/{issue_id}/transition` |
| POST | `/api/issues/{issue_id}/move-sprint` |
| GET | `/api/projects/{project_id}/backlog/` |
| GET | `/api/projects/{project_id}/kanban/` |
| GET | `/api/projects/{project_id}/sprints/{sprint_id}/board` |

### Sprint endpoints

| Method | Path |
|--------|------|
| GET | `/api/projects/{project_id}/sprints/` |
| POST | `/api/projects/{project_id}/sprints/` |
| GET | `/api/projects/{project_id}/sprints/{sprint_id}/` |
| PATCH | `/api/projects/{project_id}/sprints/{sprint_id}/` |
| POST | `/api/projects/{project_id}/sprints/{sprint_id}/start` |
| POST | `/api/projects/{project_id}/sprints/{sprint_id}/complete` |
| POST | `/api/projects/{project_id}/sprints/{sprint_id}/issues/move` |

### Workflow endpoint (read-only)

| Method | Path |
|--------|------|
| GET | `/api/projects/{project_id}/workflow/` |

### Locked request shapes

**Create issue:**

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

**Assign issue:**

```json
{ "assignee_id": "uuid" }
```

**Transition issue:**

```json
{ "target_status_id": "uuid" }
```

**Move sprint:**

```json
{ "sprint_id": "uuid" }
```

**Create sprint:**

```json
{
  "name": "Sprint 1",
  "goal": "Auth and project shell",
  "start_date": "2026-06-10",
  "end_date": "2026-06-24"
}
```

**Complete sprint:**

```json
{
  "move_incomplete_to": "backlog",
  "target_sprint_id": null
}
```

**Bulk move issues:**

```json
{
  "issue_ids": ["uuid"],
  "sprint_id": "uuid"
}
```

### Locked error codes

- `400` — validation; invalid transition; subtask/parent rules
- `403` — permission denied; archived project write
- `404` — issue/sprint/status not found
- `409` — active sprint exists; parent has subtasks; completed sprint mutation

---

## Explicitly Out of Scope

The following must **not** be added during Phase 3:

- Epics, roadmaps, versions, releases
- Time tracking (beyond `story_points` field)
- Attachments, comments, watchers, mentions
- Notifications, activity feeds, audit history
- Automation rules, webhooks, AI planning
- Custom workflows, status/transition editor
- `apps/board/` module (kanban via issues selectors)
- `apps/mytasks/` module
- Bulk transition API
- Issue linking (blocks/relates)
- Hard delete for issues or sprints
- Global cross-project issue search
- Label catalog model (labels are JSON strings only)
- Changes to Phase 1 auth or Phase 2 org/project API contracts

---

## Locked Implementation Order

| # | Slice | Scope |
|---|-------|-------|
| 1 | **Module layout & settings** | `issues`, `sprints`, `workflow` apps; URL wiring; `Project.next_issue_number` |
| 2 | **Models & migrations** | Issue, Sprint, WorkflowStatus, WorkflowTransition |
| 3 | **Contracts** | Extend five contract files |
| 4 | **Workflow seed & TransitionService** | Default workflow per project; sole transition authority |
| 5 | **PermissionService full impl** | Issue/sprint permission matrix |
| 6 | **Selectors** | Backlog, kanban, lists, project summary counts |
| 7 | **Services** | Issue CRUD, sprint lifecycle, carry-forward |
| 8 | **API layer** | Frozen endpoints; transition facade |
| 9 | **Tests & bootstrap** | Test matrix; `seed_project_workflows` command; arch tests |

---

## Migration & Bootstrap (locked)

| Concern | Approach |
|---------|----------|
| Existing projects without workflow | `seed_project_workflows` command — idempotent |
| New projects | Auto-seed workflow on create |
| Issue counter init | `next_issue_number=0` on existing projects |
| Phase 2 archived projects | Issue/sprint writes return `403` |

---

## Change Control

To modify anything in this freeze:

1. Explicit written approval required
2. Update this file with rationale and date
3. Update `.cursor/plans/phase-3-issues-sprints.md` if planning detail changes
4. Verify Phase 1 and Phase 2 freezes remain intact
5. Re-run `.cursor/checklists/phase-3-checklist.md` before merge

**Phase 3 is complete when:** all nine slices merged, checklist passes, `seed_project_workflows` validated, and endpoints match this document.
