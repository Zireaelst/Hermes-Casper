---
name: nextjs-frontend
description: Playbook for the Hermes web app — Next.js App Router, React, TypeScript, data fetching, server/client components, and React Flow. Use for building pages, layouts, and client interactivity.
---

# Next.js Frontend

## Purpose
Ship a fast, type-safe, financial-grade web app on the Next.js App Router.

## Scope
`apps/web`: routing/layouts, Server & Client Components, data fetching, caching, Server Actions,
Realtime subscriptions, and the React Flow workflow canvas.

## Best Practices
- **Server Components by default**; add `"use client"` only where interactivity is required.
- Verify Next/React APIs via **Context7**; follow current App Router conventions (no legacy patterns).
- Fetch on the server where possible; validate all server/LLM data with Zod at the edge.
- Keep business logic in `packages/shared`; components stay presentational + wiring.
- Consume Supabase Realtime for live state; don't poll the chain on hot paths.

## Constraints
- No secrets in client bundles (only `NEXT_PUBLIC_*`). No business logic in components.
- Type everything; no `any`. Verify screens with the **Playwright MCP** before marking done.

## Common Patterns
- **Route group + layout:** segment layouts for dashboard/console/marketplace with streaming/suspense.
- **Server Action + Zod:** validated mutation calling `packages/shared`, revalidating cache.
- **React Flow canvas:** typed nodes/edges for the agent workflow graph, driven by Realtime state.

## Hermes notes
UI composition uses `packages/ui` (see `shadcn-design-system`) and motion per `ui-ux`.
