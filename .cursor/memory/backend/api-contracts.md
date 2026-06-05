# API Contracts

## Naming

- Django model: `Organization` — JSON key: **`workspace`** / **`workspaces`** (never `organization` in public API).
- Scoped requests: header `X-Workspace-Id: <uuid>`.

## Standard response envelope

All DRF API responses should use a consistent JSON shape:

### Success (single resource)

```json
{
  "success": true,
  "data": { }
}
```

### Success (list)

```json
{
  "success": true,
  "data": [],
  "meta": {
    "count": 0,
    "page": 1,
    "page_size": 25
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": { "field": ["msg"] }
  }
}
```

HTTP status: 400 validation, 401 auth, 403 permission, 404 not found, 409 conflict (e.g. active sprint exists).

## Pagination

- Query: `?page=1&page_size=25`
- Default `page_size` max 100

## Issue resource (representative)

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "sprint_id": null,
  "key": "MOB-42",
  "title": "...",
  "issue_type": "task",
  "workflow_status": "todo",
  "board_status": "todo",
  "priority_level": "medium",
  "assignee": { "id": "...", "name": "...", "color": "..." },
  "labels": ["backend"],
  "story_points": 3,
  "done": false
}
```

**`sprint_id`**: nullable; omit or `null` for backlog.

## Sprint resource

```json
{
  "id": "uuid",
  "project_id": "uuid",
  "name": "Sprint 15",
  "status": "active",
  "start_date": "2026-06-01",
  "end_date": "2026-06-14",
  "issue_count": 12,
  "completed_count": 4,
  "goal": "..."
}
```

## Actions (RPC-style endpoints)

| Method | Path | Body |
|--------|------|------|
| POST | `/projects/{id}/sprints/{id}/start/` | — |
| POST | `/projects/{id}/sprints/{id}/pause/` | — |
| POST | `/projects/{id}/sprints/{id}/complete/` | `{ "destination": "backlog" \| "sprint", "target_sprint_id": "?" }` |
| POST | `/projects/{id}/issues/{id}/move/` | `{ "sprint_id": null \| "uuid" }` |

Business rules live in `services.py`, not in views.

## Versioning

Prefix: `/api/v1/`. Breaking changes → v2.

## CORS

Allow frontend origin in dev; credentials if cookie auth is used.
