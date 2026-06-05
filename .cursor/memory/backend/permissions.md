# Permissions

Phase 1 uses **role-based access** with a small, explicit permission map — not granular enterprise RBAC.

## Two scopes (keep separate)

### Workspace (`OrganizationMember.role`)

Minimal; governs org-wide actions only.

| Role | Intent |
|------|--------|
| `owner` | Created workspace; full org control |
| `admin` | Manage workspace members and settings |
| `member` | Access workspace; create projects (default) |

Store on `OrganizationMember.role`. Do **not** mix workspace roles with project roles.

### Project (`ProjectMember.role`)

Software PM roles — minimal set for dev + QA workflows.

| Role | Intent |
|------|--------|
| `admin` | Full project control (settings, members, archive) |
| `developer` | Execution — issues, sprints, assignment (Phase 2+) |
| `qa` | Testing / verification — view + status transitions on issues (Phase 2+) |
| `member` | Limited access — view project and issues, no structural changes |

Enum on `ProjectMember.role`. Default for new invites: `member`. Project creator → `admin`.

---

## Lightweight permission mapping

Central map in `apps/projects/permission_codes.py` (or `apps/common/permissions/` if shared later).

```python
class ProjectPermission(StrEnum):
    VIEW_PROJECT = "view_project"
    EDIT_PROJECT = "edit_project"
    MANAGE_MEMBERS = "manage_members"
    ARCHIVE_PROJECT = "archive_project"
    # Phase 2+
    VIEW_ISSUES = "view_issues"
    CREATE_ISSUE = "create_issue"
    EDIT_ISSUE = "edit_issue"
    MANAGE_SPRINTS = "manage_sprints"
    TRANSITION_QA = "transition_qa"  # QA workflow statuses


PROJECT_ROLE_PERMISSIONS: dict[ProjectRole, frozenset[ProjectPermission]] = {
    ProjectRole.ADMIN: frozenset({...}),      # all project permissions
    ProjectRole.DEVELOPER: frozenset({...}),
    ProjectRole.QA: frozenset({...}),
    ProjectRole.MEMBER: frozenset({...}),
}


def role_has(role: ProjectRole, permission: ProjectPermission) -> bool:
    return permission in PROJECT_ROLE_PERMISSIONS[role]
```

**Selectors** resolve `(user_id, project_id) → ProjectRole | None`.  
**DRF permissions** call `require_project_permission(user, project, ProjectPermission.X)`.  
**Services** re-check the same permission for mutations (never rely on DRF alone).

Adding a new capability later = one enum value + update the role sets — no new permission classes per action.

---

## Phase 1 — project permission matrix

| Permission | admin | developer | qa | member |
|------------|:-----:|:---------:|:--:|:------:|
| `view_project` | ✓ | ✓ | ✓ | ✓ |
| `edit_project` | ✓ | | | |
| `manage_members` | ✓ | | | |
| `archive_project` | ✓ | | | |

Phase 2 extends the same map (no new RBAC model):

| Permission | admin | developer | qa | member |
|------------|:-----:|:---------:|:--:|:------:|
| `view_issues` | ✓ | ✓ | ✓ | ✓ |
| `create_issue` | ✓ | ✓ | | |
| `edit_issue` | ✓ | ✓ | | |
| `manage_sprints` | ✓ | ✓ | | |
| `transition_qa` | ✓ | | ✓ | |

**QA intent (Phase 2):** `transition_qa` allows moving issues through QA-related workflow statuses (e.g. ready for QA → in QA → done), without project settings or sprint lifecycle control.

**Developer intent:** create/edit issues, assign sprints, start/complete sprints — not project settings or member management.

**Member intent:** read project + issues; no writes except comments (optional later).

---

## Phase 1 — workspace rules

| Action | Rule |
|--------|------|
| List / view workspace | `OrganizationMember` exists |
| Patch workspace | `owner` or `admin` |
| Manage workspace members | `owner` or `admin` |
| List projects | Any workspace member |
| Create project | Workspace `member`+ (config: allow all members) |
| Delete project | Project `admin` **or** workspace `owner` |

---

## DRF enforcement

- Default: `IsAuthenticated`
- List endpoints: filter queryset via `selectors.projects_for_user(user, workspace_id)`
- Object-level: `HasProjectPermission` with `required_permission` on the view

```python
class HasProjectPermission(BasePermission):
    required_permission: ProjectPermission

    def has_object_permission(self, request, view, obj):
        project = resolve_project(obj)
        role = selectors.get_project_role(request.user.id, project.id)
        return role is not None and role_has(role, view.required_permission)
```

Workspace-scoped views use `HasWorkspacePermission` with the same pattern and a separate `WORKSPACE_ROLE_PERMISSIONS` map.

---

## Issue visibility

- All issues in a project visible to anyone with `view_issues` (all four roles in Phase 2)
- No per-issue ACL in v1

---

## Service-layer checks

Duplicate critical checks in services:

- Membership exists before any project mutation
- `role_has(role, permission)` before `update_project`, `add_member`, etc.
- Phase 2: `sprint.project_id == issue.project_id`; sprint rules in services, not views

---

## API / UX

- Member list responses include `role`: `admin` | `developer` | `qa` | `member`
- Invite / PATCH member body: `{ "user_id": "...", "role": "developer" }`
- 403 → standard error envelope; frontend `ForbiddenPage` at `/403`

---

## Out of scope (Phase 1)

- Custom roles, permission overrides per user
- Resource-level ACL beyond project membership
- Workspace-level `developer` / `qa` (project-only)
