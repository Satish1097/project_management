# Backend Architecture

## Stack

- **Django 6** + **Django REST Framework** + **django-cors-headers**
- Postgresql in dev (`core/settings.py`)
- Entry: `manage.py`, URLs: `core/urls.py` (admin only today)

## App boundaries

| App | Domain |
|-----|--------|
| `apps.organizations` | `Organization` model; API field name `workspace` |
| `apps.accounts` | Users, auth |
| `apps.projects` | Projects, membership |
| `apps.issues` | Issues, labels, attachments |
| `apps.comments` | Issue comments |
| `apps.activities` | Audit / activity feed |
| `apps.common` | Shared utilities, base models |

## Target layering (enforce on new code)

```txt
views.py       → thin: parse request, call service, return Response
serializers.py → validation + ORM ↔ JSON
services.py    → business rules, transactions, side effects
selectors.py   → read-optimized queries (filtering, prefetch)
models.py      → fields, constraints, simple properties only
```

**Do not** put business rules in views or serializers beyond field validation.

## API layout (planned)

```txt
/api/v1/
  auth/
  workspaces/     # maps to Organization model
  projects/
  projects/{id}/sprints/
  projects/{id}/issues/
```

Register viewsets in per-app `urls.py`, include from `core/urls.py`.

## Settings notes

- `INSTALLED_APPS` includes all domain apps + `rest_framework`, `corsheaders`
- Configure `REST_FRAMEWORK`, `CORS_ALLOWED_ORIGINS` when SPA connects (Vite dev server)

## Execution

Implement in **slices** — see `phase-execution.md` and `phase-1-slices.md`. Never a full phase in one pass.

## Auth (frozen)

JWT + SimpleJWT for SPA. See `auth-flow.md`.

## Current state

Models and views are **scaffolds** — implement slice-by-slice per `phase-1-slices.md`.

## Alignment with frontend

Mirror:

- `ProjectIssue.sprintId` → nullable FK
- `Sprint.status` enum
- Issue key generation per project
- Standard envelope responses (see `api-contracts.md`)
