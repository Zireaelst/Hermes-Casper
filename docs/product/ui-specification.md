# UI Specification

> Status: Draft (Phase 3) · Updated: 2026-07-05 · Implements [01-frontend](../architecture/01-frontend.md)
> with the [design system](./design-system.md). Every screen defines loading/empty/error/success states.

> **Stale-pending-migration (2026-07-07):** "Dark-first" below describes the current console only. The
> design system is now **light-first** (see `design-system.md`); the light surface ships on the marketing
> landing first. Restyling this console to the light system is a tracked follow-up in `NEXT_SESSION.md`.

## Global shell
Left nav (Dashboard, Marketplace, Agents, Negotiations, Orders, Workflows, Approvals, Settings), top bar
(wallet connect via CSPR.click, active-run indicator, spend-today meter), content area. Dark-first
(legacy — pending migration to the light-first system).

## Screens

### Dashboard `/dashboard`
- **Purpose:** at-a-glance agent health, spend, and recent activity.
- **Content:** KPI row (`StatBadge`: active agents, spend today vs budget, orders settled, pending
  approvals), recent Orders (`OrderTimeline` compact), live runs.
- **States:** loading = skeleton KPIs; empty = "Create your first Agent" CTA; error = retry banner.

### Marketplace `/marketplace` + agent detail `/agents/[id]`
- Browse/search `ListingCard`s by capability/price/reputation; `AgentCard` with reputation.
- Detail: capabilities, listings, reputation history, "Negotiate" action.
- Empty = no listings; loading = card skeletons.

### Negotiations `/negotiations/[id]`
- **`OfferPanel`:** live Offer thread (propose/counter/accept/reject), round counter vs `max_rounds`,
  budget/floor guardrail hints. Realtime updates.
- States: open (input enabled) / accepted (→ Order CTA) / rejected|expired (read-only).

### Orders `/orders/[id]`
- **`OrderTimeline`:** quoted → authorized → settling → settled (or failed), each step timestamped.
- **`ReceiptCard`** on settle: deploy hash (mono, copyable, link to explorer), amount+asset, payer/payee.
- States: settling = animated in-progress; failed = reason + retry (new nonce) affordance.

### Workflows `/workflows/[id]` — signature surface
- **`WorkflowCanvas`** (React Flow): nodes = workers/Agents/Tasks, edges = handoffs/payments. Node states
  idle/active/waiting-HITL/done/failed with the canonical status colors. Realtime-driven.
- Side panel: selected node detail (tool calls, io, cost). Empty = "Run not started".

### Approvals `/approvals`
- Queue of `SpendApproval` items (HITL). Each: agent, order, amount+asset, payee, policy context,
  Approve/Reject. Approving resumes the run (Runtime API). Empty = "No pending approvals".

### Agents `/agents` + `/agents/[id]`
- List + create/configure Agent (identity, capabilities, `PolicyEditor` for budget/allowlist/threshold,
  key reference status). Never shows raw keys.

### Settings `/settings`
- Wallet (CSPR.click connect/disconnect, linked account), org, environment (network) indicator.

## Interaction rules
- Mutations are optimistic only where safe; **money actions are never optimistic** — reflect real state.
- Long/irreversible actions confirm; high-value spends route to Approvals (HITL).
- Amounts always `AmountText` (mono, base-unit-aware) with asset symbol.
- All live data via Supabase Realtime; no chain polling in the UI.

## Responsive & a11y
Desktop-first (operator tool) with responsive down to tablet; keyboard nav across nav + tables + canvas;
visible focus; AA contrast including status colors; reduced-motion fallbacks.

## Verification
Each screen verified with the **Playwright MCP** (interaction + screenshot) before "done"; screenshots
saved under `docs/product/demo/` during demo prep.
