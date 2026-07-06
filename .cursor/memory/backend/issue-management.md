# Issue Management (Backend)

Aligned with `frontend/src/types/issues.ts`.

## Issue types

`task`, `bug`, `story`, `epic`, `improvement`, `subtask`, `spike`

## Status fields (two layers)

| Field | Purpose |
|-------|---------|
| `workflow_status` | Detailed: backlog, todo, in_progress, review, testing, done, blocked |
| `board_status` | Kanban column: todo, in_progress, done |

On create/update: set `board_status` from `workflow_status` using same rules as `mapWorkflowToBoardStatus`.

## Priority

`priority_level`: lowest → blocker  
Optional legacy `priority` for kanban compatibility if needed in serializer.

## Sprint assignment

- `assign_to_sprint(issue_id, sprint_id | None)`
- Validate sprint.project_id == issue.project_id
- **None** removes from sprint → backlog

## Service: `create_issue`

- Require `project_id`, `title`
- Optional `sprint_id`
- Generate `key` via project sequence
- Set reporter from `request.user`

## Service: `update_issue`

- Allow partial updates
- Changing `project_id` generally forbidden (v1) or requires admin

## Service: `bulk_move_to_sprint`

- Used by complete sprint and planning UI
- Atomic transaction

## Selectors

```python
def list_project_issues(project_id, sprint_id=..., filters=...): ...
def list_backlog(project_id): ...  # sprint_id IS NULL
def get_issue_by_key(project_id, key): ...
```

## Board endpoint

`GET .../sprints/{id}/board/` → issues grouped by `board_status` or flat with status field.

## Attachments (future)

- Model: `IssueAttachment` with file storage
- Max size / MIME allowlist in validator

## Search

- Index `key`, `title` for workspace search page

## Delete

- Soft delete preferred; hard delete admin-only
