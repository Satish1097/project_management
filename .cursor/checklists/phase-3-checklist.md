# Phase 3 Checklist — Issues + Sprints + Workflow Foundation

Use this checklist for **every Phase 3 PR** and before marking Phase 3 complete.

**Freeze authority:** `.cursor/freeze/phase-3-freeze.md`  
**Prior phase authority (must remain intact):** `.cursor/freeze/phase-1-freeze.md` · `.cursor/freeze/phase-2-freeze.md`

---

## Architecture

- [ ] No architecture drift from `phase-3-freeze.md`
- [ ] Domain apps: `apps/issues`, `apps/sprints`, `apps/workflow` only for Phase 3 persistence
- [ ] Workflow **not** embedded in `apps/issues`
- [ ] No `apps/board/`, `apps/mytasks/`, or `apps/workflows/` introduced
- [ ] Service → Selector → API layering followed
- [ ] Thin views only (≤15 logic lines per method)
- [ ] Services own writes; selectors are read-only
- [ ] Contracts-only cross-module imports (`apps/contracts/`, `apps/foundation/`, `apps/permissions/`)
- [ ] No direct imports between `issues` ↔ `sprints` ↔ `workflow` models/services
- [ ] No inline role checks — `PermissionService` only
- [ ] Transition logic only in `workflow.services.TransitionService`
- [ ] Single transition endpoint: `POST /api/issues/{id}/transition`

---

## Phase 1 & 2 Preservation

- [ ] Phase 1 auth endpoints unchanged
- [ ] `UserInvitation` unchanged — no scope fields
- [ ] Phase 2 org/project endpoints unchanged
- [ ] `Project.key` / `Project.slug` immutability preserved
- [ ] Project archive behavior preserved — archived projects block issue/sprint writes
- [ ] No global roles on `User` model
- [ ] `is_staff` / `is_superuser` not used for product authorization

---

## Issue

- [ ] `Issue` model fields match freeze (key, number, status, priority, issue_type, sprint, parent, labels, position, etc.)
- [ ] Issue key server-generated: `{PROJECT_KEY}-{number}`
- [ ] `Project.next_issue_number` incremented atomically (`select_for_update`)
- [ ] `UNIQUE(project_id, number)` and `UNIQUE(key)` constraints
- [ ] Key and number immutable after create
- [ ] Priority enum: `lowest | low | medium | high | highest`
- [ ] Issue type enum: `task | bug | subtask`
- [ ] Subtask requires `parent_issue_id`; task/bug forbids parent
- [ ] One-level subtask depth only
- [ ] Subtask `project_id` matches parent
- [ ] Backlog = `sprint_id IS NULL`
- [ ] `position` ordering within status column scope
- [ ] Status change **only** via transition endpoint — not PATCH

---

## Sprint

- [ ] `Sprint` model fields match freeze
- [ ] Sprint status enum: `planned | active | completed` only
- [ ] At most one `active` sprint per project
- [ ] Start sprint returns `409` if active sprint exists
- [ ] Completed sprint is read-only
- [ ] Issues assignable only to `planned` or `active` sprints
- [ ] Incomplete carry-forward on complete (backlog or planned sprint)
- [ ] Default carry-forward = backlog

---

## Workflow

- [ ] `WorkflowStatus` and `WorkflowTransition` models match freeze
- [ ] Five frozen statuses per project: todo, in_progress, in_review, done, blocked
- [ ] Ten frozen transitions match freeze table
- [ ] Workflow seeded on project create
- [ ] `seed_project_workflows` command present and idempotent
- [ ] No custom workflow editor API
- [ ] `GET /api/projects/{id}/workflow/` read-only
- [ ] `TransitionService` is sole transition authority
- [ ] Transition role matrix matches freeze (approve/reopen restrictions)

---

## PermissionService (full implementation)

- [ ] Six new methods implemented: `can_create_issue`, `can_edit_issue`, `can_assign_issue`, `can_transition_issue`, `can_manage_sprint`, `can_plan_sprint`
- [ ] `can_manage_workflow` returns True for `project_admin` only
- [ ] `can_view_issue` / `can_view_sprint` implemented
- [ ] Role matrix matches freeze for all five project roles
- [ ] `viewer` is read-only — no create/edit/assign/transition/sprint manage
- [ ] `qa` cannot assign issues
- [ ] `developer` cannot approve (→ done) or reopen
- [ ] Archived project writes return False
- [ ] `permission_contract.py` Protocol updated
- [ ] DRF permission classes are thin wrappers
- [ ] No inline `if member.role ==` checks in views or services

---

## Contracts

- [ ] `issue_contract.py` extended with DTOs + interfaces
- [ ] `sprint_contract.py` extended per freeze
- [ ] `workflow_contract.py` extended per freeze
- [ ] `permission_contract.py` Protocol extended
- [ ] `project_contract.py` extended — `open_issue_count`, `active_sprint_id`
- [ ] Contract functions return DTOs only — no ORM leakage
- [ ] `identity_contract` used for user display fields

---

## API Surface

- [ ] Issue endpoints match freeze (10 routes)
- [ ] Sprint endpoints match freeze (7 routes)
- [ ] Workflow endpoint match freeze (1 route)
- [ ] Foundation response envelope used
- [ ] URL prefix `/api/` (no `/api/v1/`)
- [ ] Locked request shapes honored
- [ ] Error codes: `400`, `403`, `404`, `409` as specified
- [ ] No alternate transition endpoints
- [ ] No out-of-scope endpoints added

---

## Scope Exclusions

- [ ] No epics, roadmaps, time tracking
- [ ] No attachments, comments, notifications, activity
- [ ] No automation rules, custom workflows, AI planning
- [ ] No `apps/board/` or `apps/mytasks/`
- [ ] No bulk transition API
- [ ] No issue linking model
- [ ] No Label catalog model (JSON labels only)
- [ ] No hard delete for issues/sprints

---

## Validation

- [ ] Tests updated for changed behavior
- [ ] Issue key generation and counter race tests
- [ ] Transition valid/invalid path tests
- [ ] Sprint lifecycle and carry-forward tests
- [ ] Permission matrix tests per role
- [ ] Architecture tests pass (`tests/architecture/`)
- [ ] Import boundary tests pass
- [ ] Transition centralization test passes
- [ ] Implementation follows frozen slice order (1–9)
- [ ] README endpoint table updated

---

## Sign-off

| Field | Value |
|-------|-------|
| Slice | |
| PR / session | |
| Reviewer | |
| Date | |
