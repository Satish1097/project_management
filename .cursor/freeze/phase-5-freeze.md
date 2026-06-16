# Phase 5 Freeze: Sprint

This file is the immutable reference for Phase 5 Sprint decisions.

## 1) Scope

- Module: Sprint
- Purpose: freeze Sprint architecture and scope.
- Concise reference for sprint slices only.
- No future assumptions.

Sprint responsibilities:

- Sprint lifecycle.
- Sprint metadata.
- Sprint planning window.
- Sprint state transitions.

Sprint does NOT own:

- Issue content.
- Board logic.
- Workflow transitions.
- Burndown analytics.
- Velocity metrics.
- Dashboard reporting.

## 2) Model

Fields:

- `id` (UUID)
- `project` (FK -> Project)
- `name`
- `goal` (nullable text)
- `start_date` (nullable)
- `end_date` (nullable)
- `status`
- `capacity_points` (nullable integer)
- `created_at`
- `updated_at`

Allowed statuses:

- `planned`
- `active`
- `paused`
- `completed`
- `cancelled`

## 3) Business Rules

- Only one active sprint per project.
- Pause/resume only for active sprint.
- Completed/cancelled are terminal states.
- Sprint completion handled in service layer.

## 4) Permissions

Use `PermissionService` only:

- `can_view_sprint()`
- `can_start_sprint()`
- `can_complete_sprint()`

- No inline role checks.

## 5) Architecture

- Reads -> selectors.
- Writes -> service layer.
- API -> thin views.
- No business logic in serializers or views.

## 6) API Scope

- `GET /sprints`
- `POST /sprints`
- `GET /sprints/{id}`
- `PATCH /sprints/{id}`
- `POST /start`
- `POST /pause`
- `POST /resume`
- `POST /complete`
