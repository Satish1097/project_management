# Phase Execution Strategy

Development happens in **small implementation slices** — never a full phase in one pass.

## Slice rules

Each slice must be:

- Independently reviewable
- Testable on its own
- Minimal in scope
- Fully validated before the next slice

**No assumptions** for future slices. Build only what the current slice requires.

## Prompt format

```text
Phase 1 → Slice N → <Name>
```

Example progression:

```text
Phase 1 → Slice 1 → Foundation Infrastructure
Phase 1 → Slice 2 → Authentication
Phase 1 → Slice 3 → Workspace
Phase 1 → Slice 4 → Projects
```

## Before every slice (mandatory)

1. Analyze frontend (only screens affected by this slice)
2. Review workflows
3. Finalize schema (this slice only)
4. Finalize API contract
5. Finalize permissions (this slice only)
6. Explain architectural impact
7. Propose: files affected, tradeoffs, reasoning
8. **Then** implement

Never jump straight to coding.

---

# Frozen architecture decisions

Change only when explicitly requested.

## Authentication

- **JWT** + refresh token flow
- **djangorestframework-simplejwt**
- SPA stateless auth — **no** session-based auth by default

## Workspace terminology

| Layer | Name |
|-------|------|
| Django model | `Organization` |
| API / frontend JSON | `workspace` |

Do not expose `organization` in public API payloads.

Example: `{ "workspace": { "id", "name", "slug" } }`

Header: `X-Workspace-Id` (UUID of `Organization`).

## Roles

See `permissions.md` — workspace: `owner` | `admin` | `member`; project: `admin` | `developer` | `qa` | `member`.

Permission map: `ProjectPermission` + `PROJECT_ROLE_PERMISSIONS` (lightweight, not a generic engine).

---

# MVP out of scope (all phases until listed)

- Notifications, analytics, AI
- OAuth / Slack / GitHub
- Complex invite / email flows
- Automation, multi-workspace switching UX
- Dashboard analytics
- Generic permission engines
- Enterprise granular RBAC

---

# Anti-patterns (enforce)

Avoid: fat views/serializers/models, business logic in views, generic JSON blobs, premature optimization, future assumptions.

Prefer: thin CBV, services, selectors, dedicated permission checks, validators, explicit FKs, incremental slices.
