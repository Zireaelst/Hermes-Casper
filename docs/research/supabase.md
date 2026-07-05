# Research: Supabase (Hermes backend)

> Source: https://supabase.com/docs · Reviewed: 2026-07-05. Verify exact SDK/CLI signatures via
> **Context7** at implementation time; this doc captures architecture + patterns, not pinned APIs.

## Architecture
Managed Postgres + a set of services around it: **Auth** (GoTrue), **PostgREST** (auto REST API),
**Realtime** (Postgres logical replication → WebSocket), **Storage** (S3-backed), and **Edge Functions**
(Deno). Security is enforced **in the database** via **Row-Level Security (RLS)**, so the same policies
protect data across REST, Realtime, and client SDKs. Clients use `@supabase/supabase-js`; the CLI
handles local dev, migrations, and type generation.

## Core pieces
- **Postgres:** the source of truth for off-chain data + the on-chain mirror. Full SQL, extensions,
  functions, triggers, views.
- **Auth:** email/OTP, OAuth, and — relevant to Hermes — **Web3/wallet** style auth patterns; issues a
  JWT whose `auth.uid()` / claims drive RLS. Anon vs authenticated vs service-role keys.
- **RLS:** per-table policies (`select/insert/update/delete`) using `auth.uid()`, JWT claims, and
  helper functions. **Deny by default**; the service-role key bypasses RLS (server-only).
- **Realtime:** subscribe to Postgres changes (`postgres_changes`), Broadcast, and Presence — powers
  live UI without polling the chain.
- **Storage:** buckets with their own RLS-style policies for assets/artifacts.
- **Edge Functions:** Deno TS functions for webhooks, the x402 facilitator/indexer glue, and server
  logic that needs secrets. Validate input with Zod; never leak the service-role key.
- **Migrations + types:** `supabase migration new`, SQL files under `supabase/migrations`, applied via
  `supabase db push` / CI; `supabase gen types typescript` → committed into `packages/types`.

## Best Practices
- **RLS on every table, deny by default.** Test each policy for anon / authenticated / service roles.
- Migrations are forward-only, reviewed, idempotent; never edit an applied migration — add a new one.
- Keep the service-role key server-side only (Edge Functions / trusted backend). Client uses anon key.
- Use Realtime for state transitions (Order/Payment/Reputation updates) instead of polling.
- Regenerate + commit types after every schema change to keep the app type-safe.
- Put domain logic in `packages/shared`; Edge Functions/route handlers are thin validated adapters.

## Common Patterns (Hermes)
- **On-chain mirror table:** row keyed by an on-chain id (deploy/tx hash), with `status`; the event
  indexer (Edge Function or worker) writes updates; Realtime pushes to the UI.
- **Ownership RLS:** `auth.uid()`-scoped policies for an Agent's own Listings/Orders; service role for
  indexer + settlement writes only.
- **Receipts:** append-only table of x402 settlements (deploy hash, payer, payee, amount, nonce, status).
- **LangGraph checkpointer store:** Postgres-backed persistence for agent runs (see [[langgraph-agents]]).

## Limitations / Notes
- Edge Functions (Deno) have execution-time/memory limits — **not** suitable for long-running LangGraph
  graphs; use a dedicated worker/service for the agent runtime and Edge Functions for glue/webhooks.
- RLS is powerful but easy to get subtly wrong — treat policies as security-critical, test them.
- Realtime replication has throughput considerations at scale; design event volume accordingly.

## Integration Opportunities
- Supabase is the low-latency **mirror + off-chain metadata** store; the Casper contract stays the trust
  root ([[odra-contracts]]). Reconcile via the event indexer.
- Auth ↔ Casper identity: link a Supabase user to a Casper account/public key for wallet-bound access.
- Storage for agent artifacts / workflow outputs / demo screenshots.

## Notes specific to Hermes
- Model the domain vocabulary (Agent, Listing, Offer, Negotiation, Order, Workflow, Task, Payment,
  Settlement, Reputation, Receipt) as tables; DB design doc goes in `/docs/architecture`.
- Use the **Supabase MCP** (`docs/setup/mcp.md`) for SQL/migrations during development.

## Open Questions
- Wallet-based auth: use Supabase Auth Web3 flow, or custom JWT minted after a Casper signature?
- Where does the indexer run (Edge Function cron vs dedicated worker consuming CSPR.cloud events)?
- Multi-tenant isolation model for agent operators (RLS by org vs schema-per-tenant)?
