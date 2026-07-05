---
description: Design or change the Postgres schema — tables, RLS, indexes, migrations, and generated types.
argument-hint: <task, e.g. "model negotiations + offers" | "add index on orders.status">
---

Database task: **$ARGUMENTS**

Use the **database** subagent and `supabase-backend` skill. Rules:
- Use the domain vocabulary in `CLAUDE.md` §5. `snake_case` plural tables; `created_at`/`updated_at`; UUID/ULID keys.
- RLS on every table (deny by default); FKs + constraints; forward-only, idempotent migrations.
- On-chain-mirrored tables store tx/deploy id + status and reconcile via the event indexer.
- Use the **Supabase MCP** for SQL/migrations; `explain` hot queries; regenerate types into `packages/types`.
- Update the DB design doc in `/docs/architecture`. Report truthfully. No destructive change without a rollback plan.
