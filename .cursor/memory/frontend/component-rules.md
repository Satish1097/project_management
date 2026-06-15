# Component Rules

## Directory rules

```txt
components/ui/          → generic, reusable (Button, DrawerPanel, FormField, …)
components/layout/      → shells, nav, sidebars
components/issues/      → issue-specific selects (AssigneeSelect, …)
features/<area>/        → pages + feature-only components
```

## When to create

| Situation | Location |
|-----------|----------|
| Used in 2+ features | `components/ui` or `components/issues` |
| Single page only | colocate under `features/...` |
| Page + route | `features/.../*Page.tsx` |

## Existing primitives (prefer reuse)

- **Layout**: `AppShell`, `WorkspaceShell`, `ProjectShell`, `ProjectNav`, `SprintModuleTabs`
- **Forms**: `FormField`, `FormSection`, `SelectField`, `RadioOptionGroup`, `UserSelectField`, `UserMultiSelect`
- **Feedback**: `SprintStatusBadge`, `ProjectStatusBadge`, `IssueStatusBadge`, `PriorityIndicator`
- **Overlay**: `DrawerPanel` (`size="wide"` for create issue)

## Props style

- Functional components only
- Explicit prop types (`type XProps = { ... }`)
- `cn()` from `@/utils/cn` for class merging

## Domain components

Issue form fields live in `components/issues/` — keep feature drawers thin (wire context + `buildIssueFromForm`).

## Anti-patterns

- Duplicating route strings in components — import from `constants/routes.ts`
- Fetching project by id inline in many places — use `getProjectById` / context
- Inline 200-line JSX in pages — extract subcomponents under same feature folder
- New modal forms when drawer pattern exists for same entity

## File naming

- Pages: `*Page.tsx`
- Drawers: `*Drawer.tsx`
- Modals: `*Modal.tsx`
