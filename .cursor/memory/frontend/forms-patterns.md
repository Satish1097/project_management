# Forms Patterns

## Create flows (drawers)

| Entity | Component | Builder |
|--------|-----------|---------|
| Project | `CreateProjectDrawer` | `buildProjectFromForm` |
| Sprint | `CreateSprintDrawer` | `buildSprintFromForm` |
| Issue | `CreateIssueDrawer` | `buildIssueFromForm` |

All use `DrawerPanel` with title, optional subtitle, footer actions.

## Issue form specifics

- Types: `CreateIssueFormValues` in `types/createIssue.ts`
- Defaults from route: `resolveCreateIssueContext(pathname)` → `CreateIssueDefaults`
- **Sprint optional**: empty string `NO_SPRINT` in form → `sprintId: null` in model
- Board context pre-fills sprint; backlog forces null
- Field errors: local `FieldErrors` state; required title + project
- Max lengths: title, description, acceptance criteria constants in `createIssue.ts`
- Attachments: `AttachmentDropzone` + pending list before submit

## Shared form UI

```tsx
<FormField label="..." error={errors.field}>
  <Input ... />
</FormField>

<FormSection title="...">...</FormSection>
```

Selects: `SelectField`, domain selects (`IssueTypeSelect`, `IssuePrioritySelect`, `AssigneeSelect`, `LabelMultiSelect`).

## Submit pattern

1. Validate client-side
2. Call `build*FromForm(values, extras)`
3. Push via context (`addIssue`, registry update) or future API mutation
4. Close drawer + `refresh()` contexts if needed

## Sprint / project forms

- Sprint dates: ISO `YYYY-MM-DD`; `computeDaysRemaining` for active display
- Duration presets: `SprintDurationWeeks` in types

## Future API forms

- Keep builders (`build*FromForm`) as mapping layer — swap registry calls for API
- Return server validation errors into same `FieldErrors` shape
