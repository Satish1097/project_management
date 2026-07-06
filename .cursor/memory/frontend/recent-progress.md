# Frontend — Recent Progress

_Update this file when completing meaningful frontend work._

## Implemented (current baseline)

- **Project-first routing** — full tree under `/projects/:projectId` with sprint modules
- **Contexts + registries** — projects, sprints, issues with sprint assignment and bulk moves
- **Sprint lifecycle UI** — create, planning, start (validates dates + issues), pause, complete modal
- **Create drawers** — project, sprint, issue (`DrawerPanel`, wide issue form)
- **Issue domain** — types, workflow/board mapping, labels, attachments UI, priority/type selects
- **Layouts** — `ProjectShell`, `ProjectNav`, `SprintModuleTabs`, workspace/ops shells
- **Theme** — light/dark CSS variables, `ThemeToggle`
- **Legacy redirects** — `/board` → project sprint board
- **Auth guards** — mock session + protected/guest routes

## In progress / partial

- Team, releases, reports, project settings — placeholder pages
- API integration — still mock registries
- `EnhancedIssueDrawerPage` — extended detail UX

## Next likely tasks

- Wire issues/sprints/projects to DRF endpoints
- Replace `DEFAULT_BOARD_CONTEXT` hardcoding when API returns real active sprint
- Persist registries to API; keep context API stable

## Last known focus

Sprint management, backlog, planning, and board flows with optional `sprintId` on issues.
