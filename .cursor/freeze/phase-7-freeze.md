# Phase 7 Freeze: Issue Core

## Goal
Freeze Issue Core boundaries before implementation.

## Scope
In scope:
- `.cursor/freeze/*`

Out of scope:
- `apps/*`
- implementation
- services
- API
- frontend
- tests
- issue_detail submodules

## Module Responsibility
Issue Core owns:
- issue persistence
- issue updates
- sprint assignment
- filtering
- key generation
- project-scoped issue management

Issue Core responsibilities:
- issue CRUD
- sprint linkage
- assignee/reporter
- label assignment
- filtering
- key generation

Issue Core does NOT own:
- comments
- mentions
- watchers
- attachments
- subtasks
- linked issues
- history/audit
- board projection
- transition validation logic
- notifications
- activity feeds

## Architecture Freeze
| Module | Owns |
|--------|------|
| Issue Core | issue persistence, issue updates, sprint assignment, filtering, key generation |
| Workflow | transition validation, transition rules |
| Board | read-only projection |
| Issue Detail (later) | comments, attachments, watchers, relationships, history |

Rules:
- Transitions are NOT owned here.
- Transition execution handled later by `TransitionService` (Phase 8).
- No board coupling.
- No issue_detail leakage.

## Data Model Freeze

### Issue
Purpose: project-scoped work item identity and core fields.

Fields:
- `id` (UUID)
- `project` (FK -> `Project`)
- `key` (e.g. `DF-123`)
- `title`
- `description`
- `type`
- `priority`
- `status` (FK -> `WorkflowStatus`)
- `sprint` (FK -> `Sprint`, nullable)
- `assignee` (FK -> `User`, nullable)
- `reporter` (FK -> `User`)
- `due_date` (nullable)
- `estimate_hours` (nullable)
- `story_points` (nullable)
- `created_at`
- `updated_at`

Allowed `type` values:
- `task`
- `bug`
- `story`
- `epic`

Allowed `priority` values:
- `low`
- `medium`
- `high`
- `critical`

Constraints:
- unique(`project`, `key`)
- index(`project`, `status`)
- index(`project`, `sprint`)
- index(`project`, `assignee`)
- index(`project`, `priority`)

Label assignment:
- references `Label` (Phase 4) via M2M on `Issue`
- assignment logic in service layer only
- no label module business rules beyond assignment constraints

## Business Rules Freeze

### Key generation
- project-scoped
- immutable after creation
- format: `PROJECTKEY-123`
- sequential numbering per project

### Status
- must reference `WorkflowStatus`
- default status: project default todo status
- status changes via transition are NOT in Phase 7

### Sprint
- nullable
- issue may exist without sprint

### Assignee
- nullable

### Reporter
- required

## Permission Freeze
Must use:
- `PermissionService.can_view_issue()`
- `PermissionService.can_edit_issue()`

Forbidden:
- `can_create_issue()`
- inline role checks
- `if role ==`
- permission logic in views/serializers

## Layering Rules
Reads:
- selectors

Writes:
- service layer

Transitions:
- NOT owned here
- handled later by `TransitionService`

API:
- thin views only

No business logic in:
- serializers
- views

## API Scope Freeze
Supported:
- `GET /api/issues`
- `POST /api/issues`
- `GET /api/issues/{id}`
- `PATCH /api/issues/{id}`
- `POST /api/issues/{id}/assign-sprint`
- `POST /api/issues/bulk/assign-sprint`

Filtering (`GET /api/issues`):
- `project`
- `sprint`
- `assignee`
- `status`
- `priority`
- `search`

Explicitly NOT supported:
- comments
- attachments
- subtasks
- watchers
- issue links
- transition endpoint
- board movement

## Serializer Freeze

### IssueSerializer (read)
Fields:
- `id`, `project`, `key`, `title`, `description`, `type`, `priority`, `status`, `sprint`, `labels`, `assignee`, `reporter`, `due_date`, `estimate_hours`, `story_points`, `created_at`, `updated_at`

Read-only:
- `id`, `key`, `reporter`, `created_at`, `updated_at`

### IssueCreateSerializer
Fields:
- `title`, `description`, `type`, `priority`, `sprint`, `labels`, `assignee`, `due_date`, `estimate_hours`, `story_points`

Validation:
- title required
- title strip + reject empty
- `estimate_hours` >= 0
- `story_points` >= 0

Forbidden:
- `key`, `status`, `reporter`

### IssueUpdateSerializer
Fields:
- `title`, `description`, `type`, `priority`, `sprint`, `labels`, `assignee`, `due_date`, `estimate_hours`, `story_points`

No business logic in serializers.

## Guardrails
- concise immutable freeze
- no Jira-level complexity
- no issue_detail leakage
- no board coupling
- no future assumptions
