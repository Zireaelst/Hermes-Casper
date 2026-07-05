---
description: Implement or modify backend logic (Supabase schema/RLS/edge functions, packages/shared).
argument-hint: <task, e.g. "add orders table + RLS" | "x402 facilitator client">
---

Backend task: **$ARGUMENTS**

Use the **backend** (and **database** where schema is involved) subagent. Rules:
- Confirm the design exists in `/docs/architecture`; if not, design it first.
- Verify Supabase/casper-js-sdk APIs via **Context7**; use the **Supabase MCP** for SQL/migrations.
- Validate all boundaries with Zod; RLS deny-by-default; money paths idempotent + fail-closed.
- Add tests (Vitest). Update `/docs/api` + `/docs/architecture`. Run `pnpm lint && pnpm typecheck && pnpm test`.
- Report results truthfully, including any failing checks. Commit/push only if I ask.
