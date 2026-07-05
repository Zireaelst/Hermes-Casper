# Research Index (Phase 1)

One summarized doc per source (template: `.claude/templates/research-doc.md`; command: `/research`).

## Core (done — deep)
- [x] [Casper x402](./casper-x402.md) — payment flow, headers, facilitator API, TS SDK, validation ⭐ keystone
- [x] [Odra](./odra.md) — modules, storage, events, errors, access control, testing (v2.8.0)
- [x] [Casper core](./casper-core.md) — RPC, casper-js-sdk, CSPR.click, CSPR.cloud, wallet, events
- [x] [LangGraph](./langgraph.md) — StateGraph, supervisor/swarm/hierarchical, HITL, persistence
- [x] [MCP](./mcp.md) — hosts/clients/servers, tools/resources/prompts, transports, auth
- [x] [Supabase](./supabase.md) — Postgres, RLS, Auth, Realtime, Storage, Edge Functions, migrations
- [x] [Frontend stack](./frontend-stack.md) — Next.js, React, Tailwind, shadcn/ui, Framer Motion, React Flow *(light reference)*

## Deferred (lighter — expand in later passes if needed)
- [ ] Casper AI Toolkit — consolidated overview (x402 facilitator, MCP servers, CSPR.click/cloud, agent payments)
- [ ] Casper GitHub org — repo-by-repo recommendations for Hermes
- [ ] Claude Code — CLAUDE.md, skills, MCP, subagents, hooks, commands *(applied in Phase 0; doc optional)*
- [ ] Claude Skills — structure & best practices *(applied in Phase 0; doc optional)*

## Key verified facts (see also `.claude/context/glossary.md`)
- **x402:** `@make-software/casper-x402`; `exact` scheme; headers `PAYMENT-REQUIRED` / `PAYMENT-SIGNATURE`
  / `PAYMENT-RESPONSE`; facilitator `/supported /verify /settle /health`; CEP-18 `transfer_with_authorization`
  authorized via EIP-712; CAIP-2 `casper:casper-test`.
- **No official Casper MCP** — community `msanlisavas/casper-mcp` (opt-in). Verify on-chain via docs/SDK.
- **Odra** v2.8.0; **casper-js-sdk** had a v5 rewrite — verify signatures via Context7 before coding.
