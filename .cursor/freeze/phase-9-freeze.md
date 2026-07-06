# Phase 9 Freeze — Board (Kanban)

## Scope

Purpose:
Kanban board for sprint execution.

Ownership:

* board = read projection
* workflow = transition validation
* issues = persistence
* sprints = active sprint selection

Board is NOT a source of truth.

---

## Architecture

Reads:

* selectors only

Writes:

* TransitionService only

Board MUST NOT:

* mutate issue.status directly
* bypass workflow rules
* contain transition logic
* duplicate workflow validation

Forbidden:

* board business logic in frontend
* inline transition rules
* status mutation outside TransitionService

---

## Data Source

Board shows:

ACTIVE sprint issues only.

Behavior:

If active sprint exists:

* load ONLY issues from active sprint

If no active sprint:

* return empty board state

Board never shows:

* backlog issues
* paused sprint issues
* completed sprint issues

---

## API Scope

Supported:

GET /api/projects/{project_id}/kanban

POST /api/issues/{issue_id}/transition
(existing Phase 8 endpoint)

No new move endpoint.

Drag/drop MUST reuse:
transition endpoint.

---

## Read Model

Board groups issues by:

WorkflowStatus

Ordering:

* status.order ASC

Columns:

* Todo
* In Progress
* Done

(dynamic from workflow)

Issue ordering:

* created_at DESC

---

## Drag & Drop Rules

Allowed:

* valid workflow transition

Forbidden:

* invalid directional transition
* self transition
* cross-project transition

Examples:

Allowed:
Todo → In Progress
In Progress → Done
Done → In Progress

Blocked:
Todo → Done

Board UI must surface backend error.

---

## Frontend Scope

Allowed:

* kanban rendering
* drag/drop integration
* optimistic loading state
* error handling

Forbidden:

* transition logic in frontend
* hardcoded workflow assumptions
* local-only status mutation

Frontend must:

1. call transition API
2. refresh board data

---

## Out of Scope

* swimlanes
* WIP limits
* filters
* board settings
* backlog planning
* issue ranking
* analytics
* burndown
* multi-sprint board
* automation
* real-time sync
* custom board layouts

---

## Rules

Board stays intentionally simple.

Board =

read projection
+
transition trigger

Nothing more.
