# Domain Workflows

## Issue lifecycle

```txt
Create issue
  → default project/sprint from route context (resolveCreateIssueContext)
  → sprint_id optional (null = backlog)
  → workflow status drives board column (mapWorkflowToBoardStatus)
```

**Backlog**: issues with `sprintId: null`.  
**Sprint**: issues with `sprintId` set; appear on sprint board/planning.

## Sprint lifecycle

| Status      | Meaning |
|-------------|---------|
| `planned`   | Created; not started |
| `active`    | Running; at most one active per project (others → `paused`) |
| `paused`    | Was active, temporarily stopped |
| `completed` | Closed; unfinished issues moved per complete modal |
| `cancelled` | Abandoned |

**Start sprint** (frontend rules today):

- Requires start/end dates
- Requires ≥1 issue in sprint
- Pauses other active sprints on same project

**Complete sprint**:

- Unfinished issues → backlog (`null`) or another sprint
- Sprint status → `completed`

## Board workflow

- Kanban columns: `todo` | `in_progress` | `done` (board status)
- Extended workflow: `backlog`, `todo`, `in_progress`, `review`, `testing`, `done`, `blocked`
- Board maps review/testing → `in_progress`, done → `done`, else → `todo`

## Navigation workflow

Users should **never** land on a global board without project context. Legacy `/board` redirects to `DEFAULT_BOARD_CONTEXT` or parsed project/sprint.

## Planning workflow

1. Open sprint → **Planning** tab
2. Drag/select issues from backlog into sprint
3. Start sprint when ready

See `frontend/pages-flow.md` and `backend/sprint-management.md` for route/API detail.
