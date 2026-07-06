# Phase 6 Freeze: Workflow Module

## Goal
Freeze Workflow boundaries before implementation.

## Scope
In scope:
- `.cursor/freeze/*`

Out of scope:
- `apps/*`
- implementation
- services
- selectors
- API
- tests
- frontend

## Module Responsibility
Workflow owns:
- configurable statuses
- transition rules
- status ordering
- transition validation authority

Workflow does not own:
- issue persistence
- issue mutation
- board projection
- kanban behavior
- comments/history
- dashboard analytics
- sprint lifecycle

## Architecture Freeze
- Workflow is configuration plus validation only.
- `TransitionService` is the single transition authority.
- Board remains read-only.
- Issue mutation happens later via issue module.
- No inline transition logic outside `TransitionService`.

## Data Model Freeze

### 1) WorkflowScheme
Purpose: project-level workflow container.

Fields:
- `id` (UUID)
- `project` (FK -> `Project`)
- `name`
- `created_at`
- `updated_at`

Rules:
- one workflow scheme per project

Constraints:
- unique(`project`)

### 2) WorkflowStatus
Purpose: project status definition.

Fields:
- `id` (UUID)
- `project` (FK -> `Project`)
- `name`
- `category`
- `color`
- `order`
- `is_default`
- `created_at`
- `updated_at`

Allowed categories:
- `todo`
- `in_progress`
- `done`

Constraints:
- unique(`project`, `name`)
- index(`project`, `order`)
- one default status per project

Business rules:
- statuses are ordered
- exactly one default status per project
- ordering determines board columns later
- no board assumptions now

### 3) WorkflowTransition
Purpose: directional transition rule.

Fields:
- `id` (UUID)
- `project` (FK -> `Project`)
- `from_status` (FK -> `WorkflowStatus`)
- `to_status` (FK -> `WorkflowStatus`)
- `name`
- `created_at`
- `updated_at`

Constraints:
- unique(`project`, `from_status`, `to_status`)

Business rules:
- transitions are directional
- self-transitions not allowed
- validation only, no execution

## TransitionService Freeze
`TransitionService` responsibilities:
- validate status transitions
- act as central transition authority
- enforce permission gate: `PermissionService.can_transition_issue()`
- no issue persistence in Phase 6
- no domain events yet

## Permission Freeze
Must use:
- `PermissionService.can_manage_workflow()`
- `PermissionService.can_transition_issue()`

Forbidden:
- inline role checks
- `if role ==`
- permission logic in views/services

## Layering Rules
Reads:
- selectors

Writes:
- service layer

Validation:
- `TransitionService`

API:
- thin views only

No business logic in:
- serializers
- views

## API Scope Freeze
Supported:
- `GET /workflow`
- `PUT /workflow`

Not supported:
- transition execution endpoint
- board movement
- issue mutation

## Guardrails
- concise immutable freeze
- no Jira-level complexity
- no future assumptions
- no board implementation
