# Database Design (Target Schema)

Backend models are not yet implemented — this is the **canonical target** aligned with frontend types.

## Entity relationship

```txt
Organization (Workspace)
  ├── members (User ↔ Org role)
  └── Project
        ├── ProjectMember
        ├── Sprint
        └── Issue
              ├── IssueLabel (M2M Label)
              ├── Comment
              └── Activity
```

## Core tables

### `Organization`

- `id`, `name`, `slug`, timestamps

### `ProjectMember`

- `project_id`, `user_id` (unique together)
- `role`: `admin` | `developer` | `qa` | `member`
- Creator on project create → `admin`; invited users default → `member`

### `Project`

- `organization_id` (FK)
- `key` (unique per org, e.g. `MOB`) — used in issue keys
- `name`, `status`, `description`, timestamps

### `Sprint`

- `project_id` (FK, CASCADE)
- `name`, `status` (`planned|active|paused|completed|cancelled`)
- `start_date`, `end_date` (nullable until set)
- `goal`, `capacity_points`, `duration_weeks`
- **Constraint**: at most one `active` per project (enforce in service layer + DB partial unique where supported)

### `Issue`

- `project_id` (FK, required)
- `sprint_id` (FK, **nullable**, SET_NULL) — **null = backlog**
- `key` (unique per project: `{project.key}-{seq}`)
- `title`, `description`, `acceptance_criteria`
- `issue_type`, `workflow_status`, `board_status`
- `priority_level`, `component`, `story_points`
- `assignee_id` (nullable FK User)
- `reporter_id` (FK User)
- `due_date`, `done` flag, timestamps

### `Label`

- `project_id`, `name`, `color`

## Indexing

- `(project_id, sprint_id)` for board/backlog lists
- `(project_id, key)` unique
- `(sprint_id, board_status)` for kanban columns

## Migrations

- One app per bounded context; avoid circular FKs across apps — use string references or `common` base if needed.

## SQLite → Postgres

- Use same schema; replace SQLite for production
- Enforce sprint active uniqueness in `services.start_sprint`
