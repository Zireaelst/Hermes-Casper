# Research: Frontend Stack (light reference)

> Sources: nextjs.org/docs · react.dev · tailwindcss.com/docs · ui.shadcn.com · motion.dev/docs ·
> reactflow.dev · Reviewed: 2026-07-05. These are stable, well-documented libraries — **verify exact
> current APIs via Context7** when implementing. This is a combined reference, not a deep dive.

## Next.js (App Router)
- **App Router** with the `app/` directory: nested layouts, route groups, `loading.tsx`/`error.tsx`,
  streaming + Suspense. **React Server Components by default**; `"use client"` opts into client JS.
- **Data:** fetch on the server; `Server Actions` for mutations; explicit caching/revalidation.
- **Best practices:** keep client components small; no secrets in client bundles (only `NEXT_PUBLIC_*`);
  colocate route logic; move business logic to `packages/shared`.
- **Hermes surfaces:** dashboard, agent console, marketplace, negotiations, orders, workflow canvas.

## React
- Function components + hooks; Server Components change the mental model (fetch in the component).
- Rules of hooks; lift state deliberately; prefer derived state over syncing; Suspense for async UI.
- Keep components presentational; side effects at the edges.

## Tailwind CSS
- Utility-first styling; **design tokens** via the shared preset (`packages/config`). Latest Tailwind
  is CSS-first config (`@theme`) — confirm the version's config style via Context7.
- **Best practices:** no inline hex / ad-hoc CSS; semantic tokens (`--surface`, `--accent`); dark-first;
  compose with `cva` for variants; keep class lists readable (extract components, not `@apply` soup).

## shadcn/ui
- Not a dependency — **copy-in** components you own, built on Radix primitives + Tailwind. Add via the
  shadcn CLI; components live in `packages/ui`.
- **Best practices:** wrap/compose, don't fork primitives; centralize theme tokens; accessible by
  default (Radix). Build Hermes patterns (`AgentCard`, `OrderTable`, `StatBadge`, `NegotiationPanel`).

## Framer Motion (Motion)
- Declarative animation (`motion.*`, `AnimatePresence`, variants, layout animations, gestures).
- **Best practices:** purposeful, subtle motion (<300ms); respect `prefers-reduced-motion`; animate
  transforms/opacity (cheap) not layout-thrashing props; use `AnimatePresence` for enter/exit.

## React Flow
- Node/edge graph canvas: controlled `nodes`/`edges` state, `onNodesChange`/`onEdgesChange`, custom node
  types, handles, minimap, controls, background.
- **Best practices:** typed custom node/edge data; keep node components pure; drive updates from
  Realtime; virtualize/limit for large graphs.
- **Hermes:** the **workflow canvas** visualizing multi-agent workflows — nodes = Agents/Tasks, edges =
  handoffs/payments; live state from Supabase Realtime reflecting the LangGraph run.

## Cross-cutting best practices
- TypeScript strict; validate server/LLM data with Zod at the edge; no `any`.
- Design **all states** (loading/empty/error/success) and responsive behavior.
- Accessibility: semantic HTML, keyboard nav, visible focus, WCAG AA.
- Verify UI with the **Playwright MCP** before marking a screen done.

## Integration Opportunities / Hermes notes
- `apps/web` consumes `packages/ui` (shadcn) + `packages/shared` (domain) + `packages/types`.
- The workflow canvas is the signature surface — design node/edge states + live updates with care
  (see [[ui-ux]] and [[shadcn-design-system]] skills).
- Motion tokens + design tokens centralized in `packages/config` Tailwind preset.

## Open Questions
- Tailwind major version + config style (CSS-first `@theme` vs JS config) to standardize the preset.
- Component catalog scope for v1 (which shadcn components + custom patterns).
- Real-time canvas performance target (max concurrent nodes/edges in a workflow view).
