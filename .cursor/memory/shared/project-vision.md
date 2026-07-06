# HKPMS — Project Vision

**HKPMS** (internal name; UI may show **DevFlow** branding) is an internal **Jira / Linear–inspired** project management system for delivery teams.

## Goals

- **Project-first navigation** — work is organized under projects, not a flat global board.
- **Familiar PM workflows** — backlog, sprints, kanban board, issue detail, planning.
- **Single workspace** — one org/workspace context with many projects.
- **Replace ad-hoc tools** — consolidate planning, execution, and visibility without full Jira complexity.

## Non-goals (for now)

- Multi-tenant SaaS billing
- Full Jira plugin ecosystem
- Custom workflow designer (use fixed workflow statuses until backend supports config)

## Success criteria

- Users can: pick a project → manage backlog → plan/start sprints → work on board → complete sprint.
- Frontend and backend share the same domain language (see `terminology.md`).
- Agents implement features by reading `.cursor/memory` instead of long repeated prompts.

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | React 19 + TypeScript, Vite, React Router |
| Backend  | Django 6 + Django REST Framework |
| Data     | SQLite (dev); PostgreSQL-ready |

## Repo layout

```txt
frontend/     → SPA, mock registries today; API integration planned
backend/      → Django apps scaffolded; models/APIs in progress
.cursor/memory/ → canonical agent context (this tree)
```
