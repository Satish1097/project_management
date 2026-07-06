# State Management

## Approach

**React Context + module registries** — no Redux/Zustand. Keep state close to domain providers.

## Providers

| Context | Responsibility |
|---------|----------------|
| `ProjectsContext` | Project list CRUD, refresh |
| `SprintsContext` | Sprint list per project, `updateSprint`, refresh |
| `IssuesContext` | All issues, `addIssue`, `assignToSprint`, `moveManyToSprint` |
| `CreateIssueContext` | Global create-issue drawer open state + defaults |
| `AuthProvider` | Session boolean (localStorage via `authStorage`) |
| `ThemeProvider` | Light/dark preference |
| `NotificationProvider` | In-app notifications mock |

## Registry pattern

Registries hold authoritative in-memory data:

- `getIssues()`, `addIssueToRegistry`, `assignIssueToSprint`, `moveIssuesToSprint`
- `getSprintsForProjectRegistry`, sprint mutations
- `projectsRegistry` for project CRUD

Contexts **mirror** registry into React state on mount and after mutations via `refresh()`.

## Hooks

- `useSprintActions(projectId)` — start/pause/complete sprint; coordinates issues + sprints refresh
- `useIssues`, `useSprints`, `useProjects` — context accessors with error if missing provider

## Refresh rules

After sprint status change or bulk issue move → call `refreshAll()` (issues + sprints) to keep counts in sync.

## Selectors (read helpers)

Not React — plain functions:

- `projectData.ts`: `getProjectById`, `getActiveSprint`, `getSprintById`, `getSprintIssues` via registry
- `issuesRegistry.getSprintIssues(projectId, sprintId)`

Prefer these over duplicating filter logic in components.

## API migration path

1. Replace registry internals with `fetch`/API client
2. Keep context interface stable for features
3. Add loading/error fields to contexts only when needed — avoid premature abstraction
