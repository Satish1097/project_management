# Frontend Architecture

## Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router v7** (`createBrowserRouter`)
- **Tailwind CSS v4** with CSS variables in `styles/theme.css`
- **lucide-react** icons
- Path alias: `@/` → `frontend/src/`

## Layering

```txt
app/           → routes, guards, layouts
features/      → page-level UI (projects, sprints, issues, auth, …)
components/    → reusable layout + ui + domain widgets (issues/*)
contexts/      → cross-cutting client state (projects, sprints, issues)
services/      → data access, registries, builders (build*FromForm)
types/         → TS domain types
constants/     → routes, options, current user
utils/         → pure helpers (cn, dates, route resolution)
hooks/         → composed behavior (useSprintActions, useDocumentTitle)
styles/        → theme tokens, layout, typography
```

## Data today (mock phase)

In-memory **registries** back contexts:

- `projectsRegistry.ts`, `sprintsRegistry.ts`, `issuesRegistry.ts`, `labelsRegistry.ts`
- Seed data: `mockProjects.ts`, `mockSprints.ts`, `mockIssues.ts`
- Aggregator: `projectData.ts` (read helpers used by shells)

**Do not** add new ad-hoc global arrays — extend registries + context methods.

## Shell composition

| Shell | Routes | Sidebar |
|-------|--------|---------|
| `AppShell` | Dashboard, projects tree, ops modules | Ops sidebar |
| `WorkspaceShell` | Tasks, search, notifications, workspace settings | Workspace sidebar |
| `WorkspaceEmptyShell` | Empty workspace onboarding | Minimal |
| `ProjectShell` | `/projects/:projectId/*` | `ProjectNav` + optional `SprintModuleTabs` |

Full-page overlays (no shell): advanced board, issue detail drawers on sprint board routes.

## Providers (`App.tsx`)

```txt
ThemeProvider → AuthProvider → NotificationProvider
  → ProjectsProvider → SprintsProvider → IssuesProvider → RouterProvider
```

## Key conventions

- Route paths defined only in `constants/routes.ts` — use helpers (`projectBacklogPath`, etc.)
- Feature code imports from `@/`, not deep relative `../../../`
- Preserve **project-first** URLs; never reintroduce standalone `/board` as primary UX
