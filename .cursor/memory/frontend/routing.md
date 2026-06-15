# Frontend Routing

## Source of truth

`frontend/src/constants/routes.ts` — all path strings and helpers.  
`frontend/src/app/routes.tsx` — router tree.

## Route groups

### Guest (auth)

- `/login`, `/signup`, `/forgot-password` — `GuestRoute` + `AuthLayoutRoute`

### Protected — AppShell

- `/` dashboard
- `/projects` list
- `/projects/:projectId` → `ProjectShell` children:
  - index → overview
  - `backlog`, `sprints`, `sprints/:sprintId`, `sprints/:sprintId/planning`
  - `sprints/:sprintId/board`, `list`, `activity`
  - `team`, `releases`, `reports`, `settings` (some placeholders)
- `/projects/settings` (workspace-level legacy)
- `/operations`, `/qa`, `/releases`
- `/board` → `BoardLegacyRedirect`

### Protected — WorkspaceShell

- `/tasks`, `/search`, `/notifications`, `/workspace/settings`
- `/projects/settings/labels`

### Protected — full page (no shell)

- `/projects/:projectId/sprints/:sprintId/board/advanced`
- `/projects/:projectId/sprints/:sprintId/board/issue`
- `/projects/:projectId/sprints/:sprintId/board/issue/enhanced`

### Errors

- `/403`, `/404`, `*` → NotFound

## Project-first rules

1. Board/issue URLs **must** include `projectId` and `sprintId`.
2. `ProjectNav` "Board" links to **active sprint** board or falls back to sprints list.
3. Legacy paths (`/board`, `/board/issue`) **Navigate** to `DEFAULT_BOARD_CONTEXT` or sprint paths.
4. Use `parseProjectRoute(pathname)` when reading IDs from location.

## Sprint module detection

- `isSprintModulePath`, `resolveSprintModuleTab` — drive `SprintModuleTabs` in `ProjectShell`
- Tabs: Overview | Board | List | Activity | Planning (planning is path suffix)

## Guards

- `ProtectedRoute` — requires auth session
- `GuestRoute` — redirects authenticated users away from login

## Adding a new project route

1. Add helper in `routes.ts`
2. Register under `ProjectShell` in `routes.tsx`
3. Add `ProjectNav` item if top-level tab
4. Update `pages-flow.md` if user journey changes
