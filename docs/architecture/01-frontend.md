# Architecture: Frontend

> Status: Draft (Phase 2) · Updated: 2026-07-05 · See [[nextjs-frontend]], [[shadcn-design-system]], [[ui-ux]].

## Purpose
`apps/web` — the operator's window into Hermes: watch and steer autonomous agents, run the marketplace,
approve spends (HITL), and visualize workflows.

## Stack & conventions
Next.js App Router · React Server Components by default (`"use client"` only where needed) · Tailwind +
tokens (`packages/config`) · shadcn/ui via `packages/ui` · Framer Motion (subtle) · React Flow (canvas).
Domain logic in `packages/shared`; types in `packages/types`. Financial-grade. **Light-first** as of
2026-07-07 (see [design-system](../product/design-system.md)); the light surface ships on `(marketing)`
first, the `(app)` console migration is a tracked follow-up. Tokens live in `@theme` in
`apps/web/src/app/globals.css` (Tailwind v4 — no `packages/config` preset).

## Route map (App Router)
```
app/
  (marketing)/            # landing
  (app)/
    dashboard/            # activity, spend, agent health
    marketplace/          # browse Listings; agent detail
    agents/[id]/          # an agent: config, keys(ref), runs
    negotiations/[id]/    # live Offer exchange
    orders/[id]/          # order + payment + receipt state
    workflows/[id]/       # React Flow canvas of the run
    approvals/            # pending HITL spend approvals
    settings/             # wallet (CSPR.click), org
```

## Data & state
- **Reads:** Server Components fetch via `packages/shared` (Supabase, RLS-scoped) on the server.
- **Live updates:** client subscribes to Supabase **Realtime** for orders/payments/workflow/approvals —
  no chain polling.
- **Mutations:** Server Actions → `packages/shared` (Zod-validated) → Supabase / agent-runtime HTTP.
- **Wallet:** CSPR.click on the client for connect/sign (see [21-wallet-flow.md](./21-wallet-flow.md)).

## Signature surface — the workflow canvas
React Flow renders the LangGraph run: nodes = workers/Agents/Tasks, edges = handoffs/payments. State is
driven by Realtime (agent_runs + workflow/tasks). States per node: idle/active/waiting-HITL/done/failed.
Design all of them (see [[ui-ux]]).

## Component layers
`packages/ui` (primitives + Hermes patterns: `AgentCard`, `OfferPanel`, `OrderTimeline`, `ReceiptCard`,
`SpendApproval`, `WorkflowCanvas`) ← composed by `apps/web` route segments.

## Accessibility & motion
WCAG AA, keyboard nav, visible focus, semantic HTML; motion <300ms respecting `prefers-reduced-motion`.

## Open questions
- Auth UX: wallet-first (CSPR.click) vs email + linked wallet (Supabase Auth) — see [40-security.md](./40-security.md).
- How much agent control is exposed to operators in v1 (observe vs intervene).
