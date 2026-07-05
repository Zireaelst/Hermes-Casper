---
name: supabase-backend
description: Playbook for the Hermes backend on Supabase — Postgres, RLS, Auth, Realtime, Storage, Edge Functions, migrations, and type generation. Use for schema, policies, and server-side logic.
---

# Supabase Backend

## Purpose
Build a secure, real-time, type-safe backend that mirrors on-chain state.

## Scope
Postgres schema + migrations, Row-Level Security, Auth, Realtime, Storage, Edge Functions, and
generated TypeScript types into `packages/types`.

## Best Practices
- Use the **Supabase MCP** for SQL/migrations and **Context7** for API details.
- **RLS on every table, deny by default.** Test policies for each role (anon, authed, service).
- Migrations are forward-only, reviewed, idempotent; never edit an applied migration.
- Realtime broadcasts state transitions to the UI — the UI subscribes rather than polling.
- Edge Functions validate input with Zod and never expose the service-role key to clients.

## Constraints
- Never commit secrets/service-role keys. Keep `.env.example` current.
- On-chain-mirrored tables store tx/deploy id + status and reconcile via the event indexer.
- Generate + commit types after every schema change so the app stays type-safe.

## Common Patterns
- **Mirror table:** off-chain row keyed by on-chain id, updated by the indexer via Realtime.
- **RLS by ownership:** `auth.uid()`-scoped policies; service role for indexer writes only.
- **Edge function adapter:** validated request → domain logic in `packages/shared` → typed response.

## Hermes notes
Supabase is the low-latency mirror + off-chain metadata store; the contract remains authoritative.
Coordinate schema with the `database` agent and `/docs/architecture` DB design.
