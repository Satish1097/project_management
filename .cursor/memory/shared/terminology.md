# Terminology

Use these terms consistently in UI copy, types, API fields, and memory updates.

| Term | Definition | Avoid |
|------|------------|-------|
| **Workspace** | Top-level org container for users and projects | "Organization" in UI unless settings page |
| **Project** | Primary delivery unit; has key (e.g. `MOB`) | "Team" as synonym for project |
| **Issue** | Work item (task, bug, story, …) | "Ticket" in user-facing UI (ok in dev comments) |
| **Backlog** | Project issues not assigned to a sprint | "Icebox" |
| **Sprint** | Time-boxed iteration within a project | "Cycle" (reserved for future nav id) |
| **Board** | Kanban view for a **specific sprint** | Global "the board" |
| **Key** | Human-readable issue id: `{PROJECT_KEY}-{number}` | Random UUID as display id |
| **Assignee** | User responsible for issue | "Owner" |
| **Label** | Tag on issue; first label often shown on cards | "Tag" interchangeably in types |
| **Story points** | Estimation field | "Points" without context |
| **Workflow status** | Detailed status (review, testing, …) | Confusing with board column `status` |
| **Board status** | Column: `todo` \| `in_progress` \| `done` | "Status" alone in code — qualify |

## Issue types

`task` | `bug` | `story` | `epic` | `improvement` | `subtask` | `spike`

## Priority levels

`lowest` | `low` | `medium` | `high` | `critical` | `blocker`

## Sprint module tabs

`Overview` | `Planning` | `Board` | `List` | `Activity`

## API field naming (target)

- `project_id` — required on issue
- `sprint_id` — **nullable**; null means backlog
- `workflow_status` vs `board_status` — keep distinct in serializers
