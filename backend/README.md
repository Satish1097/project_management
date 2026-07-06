# Project Management — Backend

Django + DRF modular backend. Phase 0 establishes the foundation layer; feature modules are built incrementally per the modular development plan.

## Prerequisites

- Python 3.11+
- PostgreSQL 15+ (optional — SQLite used by default for local dev)
- Redis 7+ (required for health check and Celery)

## Quick start

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

API available at `http://localhost:8000`.

## Settings architecture

Settings are split by environment but loaded through a compatibility bridge:

```
core/settings.py          → imports config.settings.development
config/settings/base.py   → shared config
config/settings/development.py
config/settings/production.py
```

Entrypoints (`manage.py`, `wsgi.py`, `asgi.py`) still reference `core.settings` — no startup breakage during migration.

To use production settings later, change the import in `core/settings.py`:

```python
from config.settings.production import *
```

## Key endpoints

### Phase 0

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Service health (database + Redis) |
| `GET /api/schema/` | OpenAPI schema |
| `GET /api/docs/` | Swagger UI |
| `GET /api/redoc/` | ReDoc |
| `/admin/` | Django admin |

### Phase 1 — Auth + Identity

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public (invite token required) | Register with invitation |
| `POST` | `/api/auth/login` | Public | Email/password login; optional `remember_me` |
| `POST` | `/api/auth/refresh` | Public | Rotate JWT refresh token |
| `POST` | `/api/auth/logout` | Bearer | Blacklist refresh token |
| `POST` | `/api/auth/password/forgot` | Public | Request password reset email |
| `POST` | `/api/auth/password/reset` | Public | Reset password with uid/token |
| `GET` | `/api/me` | Bearer | Current user profile |
| `PATCH` | `/api/me` | Bearer | Update profile fields |
| `GET` | `/api/me/context` | Bearer | User + organizations + projects context |

### Phase 2 — Organizations + Projects

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/organizations` | Bearer | List organizations for current user |
| `POST` | `/api/organizations` | Superuser | Create organization (`owner_user_id` required) |
| `GET` | `/api/organizations/{org_id}` | Bearer (member) | Organization detail |
| `PATCH` | `/api/organizations/{org_id}` | Bearer (owner/admin) | Update organization |
| `POST` | `/api/organizations/{org_id}/members` | Bearer (owner/admin) | Add org member |
| `GET` | `/api/organizations/{org_id}/members` | Bearer (member) | List org members |
| `PATCH` | `/api/organizations/{org_id}/members/{user_id}` | Bearer (owner/admin) | Update org member role |
| `DELETE` | `/api/organizations/{org_id}/members/{user_id}` | Bearer (owner/admin) | Deactivate org member |
| `GET` | `/api/organizations/{org_id}/projects` | Bearer (member) | List org projects |
| `POST` | `/api/organizations/{org_id}/projects` | Bearer (member) | Create project |
| `GET` | `/api/projects/{project_id}` | Bearer (member) | Project detail |
| `PATCH` | `/api/projects/{project_id}` | Bearer (project admin/manager) | Update project |
| `POST` | `/api/projects/{project_id}/archive` | Bearer (project admin/manager) | Archive project |
| `GET` | `/api/projects/{project_id}/members` | Bearer (member) | List project members |
| `POST` | `/api/projects/{project_id}/members` | Bearer (project admin/manager) | Add project member |
| `PATCH` | `/api/projects/{project_id}/members/{user_id}` | Bearer (project admin/manager) | Update project member role |
| `DELETE` | `/api/projects/{project_id}/members/{user_id}` | Bearer (project admin/manager) | Remove project member |

Bootstrap default organization (idempotent):

```bash
python manage.py bootstrap_organization
```

Creates `internal` / **Internal Organization** owned by the first superuser when no organization exists.

### Phase 3 — Issues + Sprints + Workflow

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/projects/{project_id}/issues` | Bearer (member) | List project issues |
| `POST` | `/api/projects/{project_id}/issues` | Bearer (create issue) | Create issue |
| `GET` | `/api/issues/{issue_id}` | Bearer (member) | Issue detail |
| `PATCH` | `/api/issues/{issue_id}` | Bearer (edit issue) | Update issue fields |
| `POST` | `/api/issues/{issue_id}/assign` | Bearer (assign issue) | Assign or unassign |
| `POST` | `/api/issues/{issue_id}/transition` | Bearer (transition) | Change workflow status |
| `POST` | `/api/issues/{issue_id}/move-sprint` | Bearer (plan sprint) | Move issue to sprint/backlog |
| `GET` | `/api/projects/{project_id}/backlog` | Bearer (member) | Backlog issues |
| `GET` | `/api/projects/{project_id}/kanban` | Bearer (member) | Kanban board (backlog scope) |
| `GET` | `/api/sprints/{sprint_id}/board` | Bearer (member) | Sprint kanban board |
| `GET` | `/api/projects/{project_id}/sprints` | Bearer (member) | List sprints |
| `POST` | `/api/projects/{project_id}/sprints` | Bearer (plan sprint) | Create sprint |
| `GET` | `/api/sprints/{sprint_id}` | Bearer (member) | Sprint detail |
| `PATCH` | `/api/sprints/{sprint_id}` | Bearer (manage sprint) | Update sprint |
| `POST` | `/api/sprints/{sprint_id}/start` | Bearer (manage sprint) | Start sprint |
| `POST` | `/api/sprints/{sprint_id}/complete` | Bearer (manage sprint) | Complete sprint |
| `POST` | `/api/sprints/{sprint_id}/move-issues` | Bearer (plan sprint) | Bulk move issues |
| `GET` | `/api/projects/{project_id}/workflow` | Bearer (member) | Read-only workflow config |

Seed default workflow for existing projects (idempotent):

```bash
python manage.py seed_project_workflows
```

Safe to rerun — projects that already have workflow statuses are skipped.

**Create issue example:**

```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/issues \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Implement login API","issue_type":"task","priority":"medium"}'
```

**Transition issue example:**

```bash
curl -X POST http://localhost:8000/api/issues/{issue_id}/transition \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"target_status_id":"{status_uuid}"}'
```

**Create sprint example:**

```bash
curl -X POST http://localhost:8000/api/projects/{project_id}/sprints \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint 1","goal":"Auth shell","start_date":"2026-06-10","end_date":"2026-06-24"}'
```

## PostgreSQL setup

Set in `.env`:

```env
DB_ENGINE=postgresql
DB_NAME=project_management
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

Then run migrations:

```bash
python manage.py migrate
```

## Redis

Start Redis locally, then verify via health endpoint:

```bash
curl http://localhost:8000/api/health/
```

Expected shape:

```json
{
  "success": true,
  "message": "",
  "data": {
    "status": "healthy",
    "database": "connected",
    "redis": "connected"
  }
}
```

## Celery

```bash
celery -A config.celery worker --loglevel=info
```

Broker and result backend default to `REDIS_URL`.

## App layout

### Phase 0 (new)

- `apps/foundation/` — BaseModel, API responses, exception handler, pagination, logging, health
- `apps/contracts/` — cross-module DTO/interface stubs

### Legacy compatibility (preserved)

| Legacy app | Future mapping |
|------------|----------------|
| `accounts` | auth + identity |
| `organizations` | workspace |
| `projects` | project |
| `issues` | issue |
| `comments` | issue_collaboration |
| `activities` | activity |
| `common` | foundation |

Do not rename or remove legacy apps until their replacements are fully implemented.

## API response standard

All DRF endpoints use the global exception handler and response helpers:

```json
// Success
{ "success": true, "message": "", "data": {} }

// Error
{ "success": false, "message": "", "errors": {} }
```

## Architecture enforcement

```bash
python manage.py test tests.architecture
```

Tests enforce:

- No direct cross-module imports (contracts-only boundary)
- No inline role checks in views/services
- Board read-only (when module exists)
- Transition centralization (when workflow module exists)
- Thin view methods

## Development commands

```bash
# Run server
python manage.py runserver

# Run all tests
python manage.py test

# Run architecture tests only
python manage.py test tests.architecture

# Create superuser
python manage.py createsuperuser

# Bootstrap default organization (after superuser exists)
python manage.py bootstrap_organization

# Seed default workflow for existing projects (idempotent)
python manage.py seed_project_workflows

# Make migrations (after adding models)
python manage.py makemigrations
python manage.py migrate
```

## Logs

Request, error, and service logs are written to `backend/logs/`:

- `requests.log`
- `errors.log`
- `services.log`
