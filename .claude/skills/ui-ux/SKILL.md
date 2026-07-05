---
name: ui-ux
description: Playbook for Hermes UX and visual language — information architecture, interaction states, motion (Framer Motion), accessibility, and financial-grade design principles. Use when designing flows and screen behavior.
---

# UI / UX

## Purpose
Define how Hermes looks, moves, and feels — calm, precise, financial-grade, dark-first.

## Scope
Information architecture, user + agent flows, interaction/empty/error/loading states, motion design,
and accessibility standards across the product.

## Best Practices
- Design **all states** (loading/empty/error/success) and responsive behavior for every screen.
- Motion is purposeful and subtle (<300ms) via **Framer Motion**; respect `prefers-reduced-motion`.
- Establish clear hierarchy; dense but legible; consistent spacing and typographic scale.
- Accessibility is a requirement: keyboard nav, visible focus, WCAG AA contrast, semantic structure.
- Use the **Figma MCP** to sync/generate when a Figma source exists; keep specs in `/docs/product`.

## Constraints
- No motion that harms usability or accessibility. No new visual patterns without adding a token/spec.
- Hand implementation to `frontend`/`shadcn-design-system`; keep design and code specs in sync.

## Common Patterns
- **State matrix:** enumerate states per component before building.
- **Flow spec:** step-by-step user/agent journey with decision points and error handling.
- **Motion tokens:** standardized durations/easings referenced by components.

## Hermes notes
The workflow canvas (React Flow) is a signature surface — design node/edge states, live updates, and
negotiation/settlement affordances with special care.
