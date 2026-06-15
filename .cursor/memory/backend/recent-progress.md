# Backend — Recent Progress

_Update when landing backend changes._

## Current baseline

- Django project `core/` with apps: `accounts`, `organizations`, `projects`, `issues`, `comments`, `activities`, `common`
- **DRF** and **corsheaders** in `INSTALLED_APPS`
- Models/views largely **empty scaffolds** — no public API yet
- `core/urls.py` — admin only
- SQLite dev database

## Not yet done

- Domain models (see `database-design.md`)
- `services.py` / `selectors.py` per app
- `/api/v1/` routes and standard response envelope
- Auth endpoints + workspace scoping
- Migrations and seed data

## Project roles (Phase 1)

`admin` | `developer` | `qa` | `member` — see `permissions.md` for `ProjectPermission` map.

## Phase 1 slices (use one at a time)

| Slice | Name | Status |
|-------|------|--------|
| 1 | Foundation Infrastructure | Not started |
| 2 | Authentication | Not started |
| 3 | Workspace | Not started |
| 4 | Projects | Not started |

Details: `phase-1-slices.md`. Strategy: `phase-execution.md`.

## Phase 2+ (after Phase 1 complete)

Issues, sprints, selectors, services — separate phase slices (not planned here).

## Parity target

Frontend mock registries (`issuesRegistry`, `sprintsRegistry`) define expected behavior — backend services should match validation messages from `useSprintActions`.
