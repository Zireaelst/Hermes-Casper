# Architecture: Backend

> Status: Draft (Phase 2) · Updated: 2026-07-05 · See [[supabase-backend]].

## Purpose
The off-chain services + Supabase that support the app and agents without being the money-path source of
truth (the chain is). Layered/hexagonal: domain in `packages/shared`, adapters at the edges.

## Composition
- **Supabase** — Postgres (+RLS), Auth, Realtime, Storage, Edge Functions. See [30-database.md](./30-database.md).
- **Domain core** (`packages/shared`) — pure logic + adapter interfaces: `CasperAdapter`, `X402Adapter`,
  `SupabaseRepo`, `SignerClient`, `FacilitatorClient`. Framework-free, unit-tested with fakes.
- **Services** (`services/*`) — agent-runtime (Python), signer, facilitator, indexer, mcp. Each owns one
  responsibility and a network boundary.
- **Edge Functions** — thin, validated glue: webhooks, cron (indexer poll fallback), lightweight reads.
  Not for long-running work.

## Request/data paths
- **UI reads/writes:** `apps/web` → Supabase (RLS-enforced) + Realtime subscriptions. Heavy/domain
  logic goes through `packages/shared`, not inline in components.
- **Agent actions:** `apps/web` → agent-runtime HTTP (start/resume run) → workers/tools → adapters.
- **Money path:** agent-runtime → policy gate → Signer → facilitator → chain → indexer → Supabase.

## Boundaries & validation
Zod at every boundary (HTTP, RPC, DB rows, LLM output). Secrets (service-role, gas key, KMS creds) live
only in the relevant service; never in the client or `apps/web`.

## Consistency model
Eventual consistency between chain and mirror, reconciled by the **indexer** ([31-event-system.md](./31-event-system.md)).
Writes that must be atomic + authoritative happen **on-chain**; Supabase reflects them.

## Open questions
- Consolidate services for v1 (e.g. signer inside facilitator) to cut ops surface? (see high-level Q).
- Host: Supabase (managed) + a container platform for `services/*` (see [41-deployment.md](./41-deployment.md)).
