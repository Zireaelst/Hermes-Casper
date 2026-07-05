# Technical Specification

> Status: Draft (Phase 3) · Updated: 2026-07-05 · The implementation contract across the stack.
> Complements the [engineering blueprint](./engineering-blueprint.md) (structure) with concrete tech
> choices, standards, and cross-cutting mechanisms.

## 1. Languages & runtimes
- **TypeScript** (strict, `noUncheckedIndexedAccess`) — apps, packages, `services/{facilitator,indexer,mcp}`.
- **Python** — `services/agent-runtime` (LangGraph, ADR-004), isolated behind HTTP/MCP.
- **Rust/Odra** — `contracts/`.
- Node ≥ 22, pnpm ≥ 10, Cargo (stable). Deno for Supabase Edge Functions.

## 2. Shared standards
- Validate every boundary with **Zod** (TS) / Pydantic (Python) / typed args (Odra). No `any`.
- Explicit return types on exported functions; typed errors or `Result` unions; no floating promises.
- Files ≤ ~300 LOC / one responsibility. Conventional Commits. Required-green CI.

## 3. Core cross-cutting mechanisms
### 3.1 Money path (authoritative)
Chain is truth; Supabase mirrors. `payments.nonce` unique → idempotency; settlement confirmed by the
**indexer** (not the facilitator HTTP alone); exactly-once; **fail closed**. Amounts are base-unit
strings/`numeric(39,0)` — never floats.

### 3.2 Policy gate
`PolicyGate.evaluate(spend) -> approved | denied | requires_human`. Inputs: budget remaining, allowlist,
`auto_approve_limit`. `requires_human` raises a LangGraph `interrupt`; resume via Runtime API.

### 3.3 Tool contract
Every agent capability = a registered tool with a schema + authorization check; same definition for our
graph and MCP. LLM output validated before use.

### 3.4 Events
Odra `emit_event` → indexer (CSPR.cloud stream) → Supabase upsert (idempotent by `deploy_hash`+index) →
Realtime → UI. Durable cursor; fail-closed on parse ambiguity.

## 4. Configuration & secrets
Env-driven (see `.env.example`): Casper network + RPC/cloud, x402 facilitator URL + token package hash,
Supabase URL/keys, Anthropic key, KMS creds. Secrets per service via vault/CI; never in client bundles.
Model IDs centralized in `packages/shared` config.

## 5. Observability
Structured logs; per-run traces (nodes/tools/tokens/cost) in `agent_runs`; spend audit trail linking
run → policy decision → signature → settle → receipt; alerts on money-path failures.

## 6. Testing
- **Unit:** Vitest (TS) / pytest (Python) with adapter fakes for Casper/x402/Supabase.
- **Contract:** Odra test env + testnet integration for the x402 settle path.
- **E2E:** Playwright — discover → negotiate → pay → settle; screenshots for demo verification.
- **Money invariants:** dedicated idempotency + exactly-once + fail-closed tests.

## 7. Performance & scale (targets, refine later)
- Settlement confirmation tracked async; UI never blocks on finality.
- Workflow canvas handles the demo-scale graph smoothly (Realtime-driven, virtualized if needed).
- Indexer keeps mirror lag low; backpressure-safe.

## 8. Security (summary — see [40-security](../architecture/40-security.md))
KMS-held keys; policy-gated signing with caps + rate limits; RLS deny-by-default; OAuth on MCP; contract
access control; audit checklist before mainnet. Prompt-injection defended by the untrusted-LLM boundary.

## 9. Compliance with CLAUDE.md
Layered/hexagonal; docs updated in the same PR as code; no invented Casper/x402/Odra behavior (verify via
Context7/source); Definition of Done enforced.
