# Pages Flow

## Workspace entry (authenticated)

```txt
/ (Dashboard)
├── /projects → ProjectsListPage
├── /tasks → MyTasksPage (WorkspaceShell)
├── /search, /notifications, /workspace/settings
└── /workspace/empty → empty state onboarding
```

## Project hub (`/projects/:projectId`)

| Path | Page | Notes |
|------|------|-------|
| index | `ProjectOverviewPage` | Summary metrics |
| `backlog` | `ProjectBacklogPage` | Unscheduled issues; create with sprint null |
| `sprints` | `ProjectSprintsPage` | List/create sprints |
| `sprints/:id` | `SprintDetailPage` | Overview tab |
| `sprints/:id/planning` | `SprintPlanningPage` | Assign backlog issues |
| `sprints/:id/board` | `SprintBoardPage` | Kanban |
| `sprints/:id/list` | `SprintListPage` | Table view |
| `sprints/:id/activity` | `SprintActivityPage` | Feed |
| `team`, `releases`, `reports`, `settings` | Placeholder | Copy only |

## Sprint board overlays

From board, navigate to:

- `.../board/issue` → `IssueDetailDrawerPage`
- `.../board/issue/enhanced` → `EnhancedIssueDrawerPage`
- `.../board/advanced` → `AdvancedBoardPage` (full page)

## Create issue entry points

- Global: `CreateIssueContext` (defaults `source: 'global'`)
- Backlog: `source: 'backlog'`, `sprintId: null`
- Board/planning: `source: 'board'`, sprint pre-filled
- Project pages: `source: 'project'`, sprint usually null

## Sprint actions UI

- `CreateSprintDrawer` from sprints list
- `CompleteSprintModal` — destination backlog vs another sprint
- `useSprintActions` — start/pause/complete validation messages

## Filters

- `SprintFiltersBar`, `BoardFilters` — local UI state; filter registry lists client-side

## User mental model

Always answer: **which project?** → optional **which sprint?** → then issue/board action.
