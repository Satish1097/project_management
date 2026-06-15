# Sprint Management (Backend)

Mirror frontend `useSprintActions` and `types/sprints.ts`.

## Status enum

`planned` | `active` | `paused` | `completed` | `cancelled`

## Service: `start_sprint(project_id, sprint_id, user)`

1. Load sprint; verify project access
2. Raise if missing dates
3. Raise if sprint has zero issues (`selectors.count_sprint_issues`)
4. Set other `active` sprints on project → `paused`
5. Set sprint → `active`; compute `days_remaining` optional annotation

## Service: `pause_sprint`

- `active` → `paused`; clear computed remaining days

## Service: `complete_sprint`

Parameters:

- `destination`: `backlog` | `sprint`
- `target_sprint_id`: required if destination is sprint

Steps:

1. Find unfinished issues (`done=False`, board_status != done)
2. `move_issues_to_sprint(issues, sprint_id=null or target)`
3. Set sprint `completed`

## Service: `create_sprint`

- Default status `planned`
- Validate `end_date >= start_date`

## Selectors

```python
# selectors.py examples
def list_sprints_for_project(project_id, status=None): ...
def get_active_sprint(project_id): ...
def count_sprint_issues(sprint_id): ...
```

Prefetch issues for board endpoints.

## API endpoints

- CRUD: `/api/v1/projects/{project_id}/sprints/`
- Actions: `.../sprints/{id}/start/`, `pause/`, `complete/`

## Frontend parity checklist

| Frontend rule | Backend |
|---------------|---------|
| One active sprint | Pause others on start |
| Need dates | Validate non-null |
| Need ≥1 issue | Count > 0 |
| Complete moves issues | `move_issues` service |
| `sprint_id` nullable on issues | FK null=True |
