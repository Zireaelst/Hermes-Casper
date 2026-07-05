# Engineering Blueprint

> Status: Draft (Phase 3) · Updated: 2026-07-05 · The "how we build it" companion to the architecture docs.

## 1. Purpose
Translate the architecture ([docs/architecture](../architecture)) into concrete engineering structure,
module boundaries, contracts between components, and build/test/quality practices — the map an engineer
(or Claude subagent) follows to implement Hermes.

## 2. Monorepo layout (target)
```
apps/web                     Next.js App Router (operator console, marketplace, canvas)
apps/docs                    Public docs site
packages/types               Zod schemas + generated types (domain, x402, protocol, supabase, contracts)
packages/shared              Domain logic + adapter interfaces (framework-free)
packages/ui                  shadcn/ui design system + Hermes components
packages/config              eslint / tsconfig / tailwind / prettier presets
contracts/                   Odra: hermes-token, agent-registry, reputation-anchor
services/agent-runtime       Python LangGraph supervisor (checkpointed)
services/facilitator         x402 facilitator (Node; funded gas key)
services/signer              KMS-backed signer (policy-gated)
services/indexer             Casper/CSPR.cloud events → Supabase
services/mcp                 Hermes MCP server (Streamable HTTP + OAuth)
supabase/                    migrations, seed, edge functions, config
```

## 3. Layering & dependency rules
`apps/web` → `packages/ui` → `packages/shared` → `packages/types`. Services depend on `packages/types`
(and may embed `packages/shared` logic) but never on `apps/web`. Contracts are independent; generated
ABIs/types flow into `packages/types`. **No circular deps; no app→app imports.** Domain logic in
`packages/shared` is free of framework/DB/UI specifics — adapters sit at the edges behind interfaces.

## 4. Key module contracts (interfaces in `packages/shared`)
- `CasperAdapter` — deploy lifecycle, reads (behind casper-js-sdk / CSPR.cloud).
- `X402Client` / `FacilitatorClient` — build/parse payment headers; `/verify`, `/settle`.
- `SignerClient` — request a policy-approved signature (never returns keys).
- `PolicyGate` — `evaluate(spend) -> approved | denied | requires_human`.
- `Repo` (Supabase) — typed repositories per aggregate (agents, listings, orders, payments…).
- `AgentRuntimeClient` — start/resume run, get state (HTTP to `services/agent-runtime`).

All boundaries validate with **Zod**; exported functions have explicit return types; errors are typed
unions or thrown typed classes (never swallowed).

## 5. Data & money invariants (must hold)
- On-chain is authoritative; Supabase is a reconciled mirror.
- `payments.nonce` unique = idempotency; settlement confirmed by the **indexer**, not the facilitator's
  HTTP response alone; exactly-once; **fail closed** on ambiguity.
- Every spend passes the **policy gate** and produces a **Receipt** with a deploy hash.

## 6. Language & runtime choices (ADRs)
TS (apps + packages + facilitator/indexer/mcp), **Python** for `services/agent-runtime` (ADR-004), Rust/
Odra for contracts. Isolate Python behind an HTTP/MCP boundary so it never leaks into the TS graph.

## 7. Quality gates (Definition of Done)
`pnpm lint && pnpm typecheck && pnpm test` green; contracts `cargo fmt` + `clippy -D warnings` + Odra
tests; new logic has tests; the relevant `/docs` file updated; no secrets/dead code; behavior verified
(Playwright for UI). Required-green CI before merge.

## 8. Testing strategy (summary — see technical spec)
Unit (Vitest) with adapter fakes; contract tests (Odra env + testnet); E2E (Playwright) for the full
discover→pay→settle path; explicit **idempotency/exactly-once** tests on money paths.

## 9. Environments & secrets
`local` (testnet/NCTL + local Supabase) → `staging` → `production` (testnet for buildathon). Secrets per
service via vault/CI (gas key, KMS creds, service-role). `.env.example` stays current; never commit `.env`.

## 10. Build order (maps to roadmap)
types/config → shared skeleton + Supabase → contracts + facilitator + signer spike → agent runtime +
policy → web + canvas → MCP + reputation → hardening + demo.

## 11. Risks & de-risking
Top risk = autonomous EIP-712 signing compatibility (Signer↔facilitator). De-risk in M2 with a
standalone spike before building the payment node. Second = settlement SPOF (facilitator) — monitor,
rate-limit, cap gas.
