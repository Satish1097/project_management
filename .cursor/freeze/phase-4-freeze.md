# Phase 4 Freeze: Labels

This file is the immutable reference for Phase 4 Label decisions.

## 1) Scope

- Module: `apps/label`
- Labels are project-scoped.

## 2) Model

Fields:

- `id` (UUID)
- `project` (FK -> Project)
- `name` (max_length=50)
- `color` (`#RRGGBB`)
- `is_archived`
- `created_at`
- `updated_at`

Constraints:

- `unique(project, name)`
- `index(project, is_archived)`

## 3) Business Rules

- Labels are project scoped.
- Duplicate prevention is case-insensitive.
- Name normalization trims whitespace.
- Archive is soft archive only.
- Never hard delete.

## 4) Permissions

- `PermissionService.can_manage_labels()`
- No inline role checks.
- Forbidden: `if role ==`

## 5) Architecture

- Reads -> selectors.
- Writes -> service layer.
- API -> thin views.
- No business logic in serializers or views.

## 6) API Scope

Supported:

- `GET /labels`
- `POST /labels`
- `PATCH /labels/{id}`
- `DELETE /labels/{id}`

Delete behavior:

- Archive only.
