# Product Context

## What HKPMS is

Internal PM tool combining:

- **Jira-like** project keys, issue types, workflow statuses, story points, components.
- **Linear-like** clean UI, fast drawers, project-scoped navigation, minimal chrome.

## Primary user journeys

1. **Workspace** — dashboard, my tasks, notifications, search, workspace settings.
2. **Projects list** — create/open projects.
3. **Project hub** — overview, backlog, sprints, board (via active sprint), team/releases/reports/settings (some placeholders).
4. **Sprint lifecycle** — create → planning → start → board/list/activity → complete (move unfinished issues).
5. **Issues** — create from backlog/board/global; optional sprint; detail in route-overlay drawers.

## Hierarchy (canonical)

```txt
Workspace
  └── Projects
        ├── Overview
        ├── Backlog        (issues with sprint_id = null)
        ├── Sprints
        │     ├── Sprint overview
        │     ├── Planning
        │     ├── Board / List / Activity
        │     └── Issue overlays (detail drawers on board routes)
        └── Issues (always belong to exactly one project)
```

## Current implementation status

| Area              | Status |
|-------------------|--------|
| Frontend UI/flows | Rich mock data + in-memory registries (`*Registry.ts`) |
| Backend models/API| Scaffolded apps; models/views mostly empty |
| Auth              | Frontend session mock; backend auth TBD |

When implementing API work, **mirror frontend types** in DRF serializers first, then persist.

## Modules outside core PM (workspace scope)

- Operations, QA, Releases dashboards (AppShell routes)
- Legacy `/board` paths redirect into project/sprint context
