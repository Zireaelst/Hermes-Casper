---
name: shadcn-design-system
description: Playbook for the Hermes design system — shadcn/ui primitives, Tailwind tokens, and shared components in packages/ui. Use when building or extending reusable UI components.
---

# shadcn Design System

## Purpose
Maintain one consistent, accessible, themeable component system.

## Scope
`packages/ui`: shadcn/ui primitives, composed components, Tailwind token preset (color/type/spacing/
radius/elevation/motion), and theming (dark-first).

## Best Practices
- **Wrap, don't fork** shadcn primitives. Add variants via `cva`, not by editing the primitive.
- All styling via **Tailwind + tokens** from the shared preset — no inline hex, no ad-hoc CSS.
- Components are accessible by default (semantic roles, keyboard, focus-visible, AA contrast).
- Verify shadcn/Tailwind usage via **Context7**; keep a component catalog in `/docs/product`.

## Constraints
- No app/business logic in `packages/ui` — presentational + composition only.
- Every component documents its props, variants, and states; ships with all interaction states.

## Common Patterns
- **Variant component:** primitive + `cva` variants + typed props + stories/examples.
- **Composed pattern:** e.g. `DataTable`, `AgentCard`, `StatBadge` built from primitives.
- **Theme tokens:** semantic tokens (`--surface`, `--accent`) mapped in the Tailwind preset.

## Hermes notes
Consumed by `apps/web`; visual language and motion defined with the `ui-ux` skill and `ui-designer` agent.
