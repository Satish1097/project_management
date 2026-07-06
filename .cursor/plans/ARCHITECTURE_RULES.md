# Architecture Rules

Binding rules for all backend development. Every Cursor prompt and PR must comply.

---

## Layer Responsibilities

| Layer | Owns | Must NOT contain |
|-------|------|------------------|
| **Views** (`api/views.py`) | HTTP parsing, serializer binding, response codes | Business logic, role checks, DB queries |
| **Services** (`services/`) | Business logic, orchestration, event emission | HTTP concerns, direct queryset in complex logic |
| **Selectors** (`selectors.py`) | Read-only queries, projections, aggregations | Mutations, side effects |
| **Models** (`models.py`) | Schema, constraints, simple properties | Business rules, cross-model orchestration |
| **Contracts** (`apps/contracts/`) | DTOs, interfaces, typed boundaries | Implementation, DB access |

---

## Core Rules

### 1. No business logic in views
Views delegate to services or selectors. A view method should be ≤ 15 lines excluding serializer setup.

### 2. Services own business logic
All write operations, validation beyond serializer-level, and side-effect orchestration live in services.

### 3. Selectors own reads
All list/detail queries and projections (including board aggregation) live in selectors. Board module uses selectors exclusively.

### 4. Board is projection only
`apps/board/` provides read-only aggregation APIs. It must never mutate issues or execute transitions.

### 5. Transition logic is centralized
- **Single authority:** `workflow.services.TransitionService`
- **Single API surface:** `POST /api/issues/{id}/transition` in `apps/issue/`
- Transitions are invoked from sprint board, my tasks, issue detail, backlog, and all future views through this one endpoint.
- No `POST /board/move`, no `POST /me/tasks/{id}/transition`, no transition logic in any other module.

### 6. No direct cross-module access
- Modules communicate via `apps/contracts/` only.
- **Forbidden:** `from apps.issue.models import Issue` inside `apps/board/`
- **Allowed:** `from apps.contracts.issue_contract import IssueBoardDTO, get_sprint_issues`

### 7. Contracts-first communication
- Define contract stubs in `apps/contracts/` before implementing a phase.
- Contracts expose DTOs and narrow function signatures — not ORM models.
- When a module needs data from another, add/read a contract file — never import the source module.

### 8. Permission service is mandatory
- **Single authority:** `permissions.services.PermissionService`
- All authorization checks use `PermissionService` methods.
- **Forbidden in views and services:**
  ```python
  if user.role == "admin":        # NO
  if member.role in ("lead",):    # NO
  if request.user.is_staff:     # NO (use PermissionService)
  ```
- DRF permission classes are thin wrappers that call `PermissionService`.

### 9. issue_detail is a facade over submodules
- `issue_detail/` routes API requests to bounded submodules:
  - `collaboration/` — comments, mentions, watchers
  - `attachment/` — file upload/download
  - `relationship/` — subtasks, links
  - `history/` — audit trail
- Build and test one submodule per phase. Do not merge submodule logic into the facade.

### 10. Domain events for side effects
- Write services emit domain events (e.g. `IssueTransitioned`, `CommentAdded`).
- `activity`, `notification`, and `search` consume events asynchronously — they are never called directly from issue/workflow services.

---

## PermissionService Method Catalog (initial)

```text
can_view_workspace(user, workspace)
can_view_project(user, project)
can_edit_project(user, project)
can_manage_members(user, project)
can_manage_workflow(user, project)
can_manage_labels(user, project)
can_view_sprint(user, sprint)
can_start_sprint(user, sprint)
can_complete_sprint(user, sprint)
can_view_issue(user, issue)
can_edit_issue(user, issue)
can_edit_issue_field(user, issue, field_name)
can_transition_issue(user, issue, target_status)
can_comment_on_issue(user, issue)
can_manage_attachments(user, issue)
```

Add new methods here before using them. Never invent inline checks.

---

## Import Boundary Rules

```text
ALLOWED:
  apps/<any>/  →  apps/contracts/
  apps/<any>/  →  apps/permissions/
  apps/<any>/  →  apps/foundation/

FORBIDDEN:
  apps/board/       →  apps/issue/models.py
  apps/mytasks/     →  apps/issue/services/
  apps/issue/       →  apps/workflow/models.py  (use contracts)
  apps/<module_A>/  →  apps/<module_B>/         (any direct cross-module import)
```

Enforced by `tests/architecture/test_import_boundaries.py`.

---

## API Design Rules

| Concern | Endpoint | Owner |
|---------|----------|-------|
| Issue status change | `POST /api/issues/{id}/transition` | `issue` (facade) → `workflow.TransitionService` |
| Sprint board data | `GET /api/projects/{id}/sprints/{sid}/board` | `board` (read-only) |
| My tasks data | `GET /api/me/tasks`, `GET /api/me/tasks/board` | `mytasks` (read-only) |
| Issue CRUD | `GET/POST/PATCH /api/issues` | `issue` |
| Sprint lifecycle | `POST .../sprints/{sid}/start\|pause\|complete` | `sprint` |

---

## Cursor Prompt Checklist

Before starting any backend task, confirm:

- [ ] Scope is one module (or one `issue_detail` submodule)
- [ ] Only `apps/contracts/` files are pulled from dependencies
- [ ] `ARCHITECTURE_RULES.md` is included in context
- [ ] No transition logic outside `workflow.TransitionService`
- [ ] No role checks outside `PermissionService`
- [ ] Board/mytasks changes are read-only
- [ ] Tests include contract tests + import boundary check
