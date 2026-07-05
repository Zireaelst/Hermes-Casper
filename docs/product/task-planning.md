# Task Planning (Phase 4)

> Status: Draft · Updated: 2026-07-05 · Lean plan — the build starts now. Milestones map to
> [roadmap.md](./roadmap.md). This doubles as the issue backlog (create as GitHub issues on demand).

## Epics
- **E1 Foundation** — monorepo packages, tooling, CI, Supabase project.
- **E2 Contracts** — Odra HermesToken (CEP-18), AgentRegistry, ReputationAnchor + tests + testnet deploy.
- **E3 Payments** — x402 facilitator, Signer spike, payments/receipts + indexer.
- **E4 Agent runtime** — LangGraph supervisor, policy gate, HITL, payment node.
- **E5 Web console** — auth/wallet, marketplace, negotiations, orders, approvals, workflow canvas.
- **E6 MCP + reputation** — Hermes MCP server, reputation accrual + anchor + display.
- **E7 Hardening + demo** — security, idempotency tests, E2E demo.

## Milestones ↔ epics
M1 E1 · M2 E2+E3 · M3 E4 · M4 E5 · M5 E6 · M6 E7.

## Development order (critical path)
1. **E1 Foundation** → 2. **E2 Contracts** (trust root) → 3. **E3 Payments** (settlement real; Signer↔
   facilitator EIP-712 spike is the #1 de-risk) → 4. **E4 Runtime** → 5. **E5 Web** ∥ **E6 MCP** →
   6. **E7 Hardening/demo**.

## Sprint plan (2 lean sprints to a demoable core)
**Sprint 1 — Foundation + trust root**
- [ ] E1: `packages/config` (tsconfig/eslint/prettier/tailwind presets)
- [ ] E1: `packages/types` (Zod domain + x402 + protocol schemas)
- [ ] E1: `packages/shared` (adapter interfaces + result/error utils)
- [ ] E1: root tooling (prettier/eslint), `pnpm typecheck` green, CI workflow
- [ ] E1: Supabase project + first migration (agents, listings, negotiations, offers, orders)
- [ ] E2: HermesToken (CEP-18) + AgentRegistry Odra scaffolds + unit tests
- [ ] E3: facilitator spike — verify EIP-712 authorization interop (de-risk)

**Sprint 2 — Payments + runtime + thin UI**
- [ ] E2: ReputationAnchor + testnet deploy; record package hashes
- [ ] E3: payments/receipts tables + indexer v1; facilitator wired to HermesToken
- [ ] E4: LangGraph supervisor + policy gate + payment node (402→gate→sign→settle→receipt)
- [ ] E5: `apps/web` init + dashboard + marketplace (read) + order/receipt view (Realtime)
- [ ] E7: idempotency/exactly-once tests on the money path

## Issue backlog (seed — one line each; expand to GitHub issues as needed)
`E1-1 config presets` · `E1-2 types/zod domain` · `E1-3 shared adapters` · `E1-4 CI` · `E1-5 supabase init`
· `E2-1 cep18 token` · `E2-2 agent registry` · `E2-3 reputation anchor` · `E2-4 odra tests` · `E2-5 testnet deploy`
· `E3-1 facilitator` · `E3-2 signer spike` · `E3-3 indexer` · `E3-4 payments repo`
· `E4-1 supervisor graph` · `E4-2 policy gate` · `E4-3 HITL` · `E4-4 payment node`
· `E5-1 web init+auth` · `E5-2 marketplace` · `E5-3 negotiations` · `E5-4 orders/receipts` · `E5-5 approvals` · `E5-6 canvas`
· `E6-1 mcp server` · `E6-2 reputation service`
· `E7-1 money tests` · `E7-2 security review` · `E7-3 e2e demo`.

## Definition of Done (per issue)
Compiles; `pnpm lint && typecheck && test` (or `cargo`/`clippy`/odra) green; tests for new logic; relevant
`/docs` touched if behavior changed; no secrets/dead code; behavior verified. Branch per issue; small PRs.

---

## MVP Session Plan (10-minute sessions — see `NEXT_SESSION.md`)

> Locked scope cuts vs the Phase 2 production architecture, chosen for session-budget reasons:
> **in-process TS agent logic** (no Python/LangGraph service), **one collapsed Signer+Facilitator TS
> module** (demo env-var key, not real KMS), **Odra local test env only until one dedicated deploy
> session**, **no separate indexer** (poll on demand). Revisit post-MVP if the roadmap needs the full
> production topology. Each session = one artifact, one exit command, one commit+push.

| # | Session | Artifact | Exit criterion |
|---|---------|----------|-----------------|
| A | ✅ done | `packages/{config,types,shared}` | `pnpm lint/typecheck/test` green (`1fa23fa`) |
| B | Contracts I | `contracts/hermes-token` (CEP-18 via `odra_modules`) + `contracts/agent-registry` | `cargo test` (Odra local env) green |
| C | Contracts II | `contracts/reputation-anchor`; finalize Cargo workspace | all 3 contracts' Odra tests green |
| D | Supabase schema | `supabase/migrations/*.sql` (verbatim from `database-schema.md`), `supabase/config.toml`, seed | `supabase db reset` / lint applies cleanly (needs user's Supabase project linked) |
| E | Repo layer | `packages/shared` Supabase client + typed repos implementing `Repo` (generated types from D) | `pnpm --filter @hermes/shared typecheck/test` green |
| F1 | Signer spike | authorization-signing module + math-level unit test (no chain) — de-risks EIP-712 compat | unit test green |
| F2 | Facilitator | collapsed sign+verify+settle module wired to `casper-js-sdk`, run against Odra local env | local settle test green |
| G | Agent logic | in-process TS orchestrator: discover→negotiate→order→pay, using `PolicyGate`+facilitator+repo | script/test: fake run reaches `settled` |
| H | Web init | `apps/web` (App Router, Tailwind, shadcn init), dashboard reading Supabase (read-only) | `pnpm dev` renders dashboard |
| I | Web core flow | Marketplace + Order/Receipt pages; "Buy now" server action calling session G's logic | click-through reaches `settled` in UI (local env) |
| J | Testnet deploy | Deploy contracts to Casper testnet; point facilitator/signer + web at real testnet | one real payment settles on testnet with a receipt |
| K | Harden + demo | Error/empty states, minimal auth guard, demo script, one Playwright screenshot | demo runs end-to-end; screenshot captured |

**Splitting rule:** if a session's diff would exceed ~1 package/contract or ~150 LOC, split it further
(e.g. F1/F2 already pre-split for this reason). Prefer more, smaller, always-green sessions over fewer
large ones — a session that ends red wastes the *next* session's ramp-up too.

**External-dependency sessions** (D, J) need the user to have credentials ready beforehand (Supabase
project + `SUPABASE_ACCESS_TOKEN`/`SUPABASE_PROJECT_REF`; a funded testnet account) — confirm before
starting so the 10 minutes aren't spent waiting on account creation.
