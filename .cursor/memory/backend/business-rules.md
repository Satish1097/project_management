# Business Rules

Centralize in `services.py`. Selectors only read; views only orchestrate.

## Project

- `key` unique within workspace; uppercase alphanumeric, 2–10 chars
- Archive/disable project soft-deletes issues from active boards (future)

## Issue

- **Must** belong to exactly one project
- **`sprint_id` optional** — `null` means backlog
- Cannot assign issue to sprint on another project
- `key` auto-generated: next number per project (`MOB-1`, `MOB-2`, …)
- `board_status` derived from `workflow_status` on save (same mapping as frontend `mapWorkflowToBoardStatus`)
- `done` true when `workflow_status == done`

## Sprint

- Belongs to one project
- Status transitions:
  - `planned` → `active` (start)
  - `active` → `paused` | `completed`
  - `active` → only one per project at a time
- Start requires: `start_date`, `end_date`, ≥1 issue linked
- Completing moves unfinished issues per `destination` (backlog or target sprint)
- Paused sprint does not count as active

## Backlog

- Filter: `project_id=X AND sprint_id IS NULL`
- Ordering: priority, updated, manual rank (future)

## Labels

- Scoped to project; M2M on issues

## Comments & activity

- Comment on issue → activity row “commented”
- Status/sprint/assignee changes → activity audit trail

## Validation errors

Return `VALIDATION_ERROR` with field details — frontend maps to form errors.

## Idempotency

- `start_sprint` on already active sprint → 409 or no-op with message
- Moving issue to same sprint → success no-op

## Transactions

- `complete_sprint`, `start_sprint`, bulk issue moves — wrap in `@transaction.atomic`
