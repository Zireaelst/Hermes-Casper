# Roadmap

> Status: Draft (Phase 3) · Updated: 2026-07-05 · Target: Casper Agentic Buildathon 2026 (testnet).
> Detailed epics/issues live in Phase 4 planning.

## Guiding order
Trust root first (contracts + x402), then the autonomous brain (agent runtime + policy), then the human
surface (console + canvas), then the open surface (MCP + reputation), then hardening + demo.

## Milestones
### M0 — Engineering environment ✅ (done)
Monorepo, CLAUDE.md, MCP config, skills/agents/commands, research + architecture docs.

### M1 — Foundations
- `packages/types` (Zod schemas: domain, x402, protocol), `packages/config` (eslint/tsconfig/tailwind).
- `packages/shared` skeleton + adapter interfaces (Casper, x402, Supabase, Signer, Facilitator).
- Supabase project + initial migrations (agents, listings, negotiations, offers, orders).
- CI: lint + typecheck + test + contract build.

### M2 — Contracts + x402 (trust root)
- Odra `HermesToken` (CEP-18) + `AgentRegistry` + `ReputationAnchor`; Odra tests; testnet deploy.
- Stand up the **x402 facilitator** (from `casper-x402` JS) against `HermesToken`.
- **Signer service** spike: prove autonomous EIP-712 authorization the facilitator accepts.
- `payments`/`receipts` tables + indexer v1 (settlement confirmation).

### M3 — Agent runtime + policy
- `services/agent-runtime` (Python LangGraph) supervisor + workers; Supabase checkpointer.
- **Policy gate** (budget/allowlist/threshold) + HITL interrupts.
- Payment node wired end-to-end: 402 → gate → Signer → facilitator → Receipt.

### M4 — Web console + canvas
- `apps/web`: auth + wallet (CSPR.click), dashboard, marketplace, negotiations, orders, **Approvals**.
- **Workflow canvas** (React Flow) driven by Realtime; design system in `packages/ui`.

### M5 — MCP surface + reputation
- **Hermes MCP server**: `agent_discover`, `offer_*`, `order_create`, `service_invoke`, `payment_pay`,
  `reputation_get` + resources/prompts.
- Reputation accrual from Orders → on-chain anchor → marketplace display.

### M6 — Hardening + demo
- Security review (key custody, facilitator hardening), idempotency/exactly-once tests, load on canvas.
- E2E demo (Playwright): discover → negotiate → pay → settle, with screenshots + runbook.

## Sequencing notes
- M2 is the critical path (settlement must be real before autonomy). The Signer↔facilitator spike is the
  top de-risking task.
- M4 and M5 can partially parallelize once M3's runtime API is stable.

## Out of scope (post-buildathon)
Mainnet + audit, streaming payments, escrow/arbitration, fiat ramps, multi-tenant per-operator facilitators.
