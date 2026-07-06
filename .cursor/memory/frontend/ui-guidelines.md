# UI Guidelines

## Design system

- Brand tokens: `--df-*` in `styles/theme.css` (light `:root`, dark `.dark` on `html`)
- Tailwind theme maps to `devflow-*` / semantic classes — **use tokens**, not random hex in components
- Typography scales: `text-page-title`, `text-body`, `text-caption` (`styles/typography.css`)

## Dark mode

- **Required** for all new UI — test light + dark
- `ThemeProvider` + `ThemeToggle`; never hardcode light-only backgrounds
- Drawer overlay: `dark:bg-black/50` pattern in `DrawerPanel`
- Use `var(--df-*)` or `devflow-*` classes that switch with theme

## Layout

- Sticky project header in `ProjectShell` with status badge, sprint meta, team avatars
- Sidebars: workspace vs ops — don't mix nav items across shells
- Spacing: prefer existing padding in layout shells (`px-4`, `gap-3`) — match neighbors

## Surfaces

| Pattern | Use for |
|---------|---------|
| **Drawer** (`DrawerPanel`) | Create/edit flows: project, sprint, issue |
| **Modal** | Confirmations (e.g. complete sprint), destructive actions |
| **Full-page overlay routes** | Issue detail on board (drawer pages), advanced board |

**Default**: forms and multi-field create → **drawer**, not centered modal.

## Do not redesign

- Unless explicitly requested, **extend** existing patterns
- Keep HKPMS visual language (blue primary `#0058be`, card surfaces, subtle borders)
- No new design system (Material, shadcn wholesale) without approval

## Icons

- `lucide-react`, `strokeWidth={1.75}` typical in nav

## Empty states

- Use existing placeholder pages (`ProjectPlaceholderPage`) pattern for unbuilt tabs
- Empty workspace: `EmptyWorkspaceSidebar` + `/workspace/empty`

## Accessibility

- Drawers: `role="dialog"`, `aria-labelledby`, Escape to close, body scroll lock
