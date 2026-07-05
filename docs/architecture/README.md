# Architecture Index (Phase 2)

System + subsystem designs. Template: `.claude/templates/architecture-doc.md`; command: `/architecture`.
Gating decisions: `.claude/context/tech-decisions.md` (ADR-003..006 — **proposed, review requested**).

## Documents
| # | Doc | Scope |
|---|-----|-------|
| 00 | [High-level](./00-high-level.md) | System context, components, master diagram, trust model |
| 01 | [Frontend](./01-frontend.md) | Next.js App Router, routes, canvas, data/state |
| 02 | [Backend](./02-backend.md) | Supabase + services, hexagonal boundaries |
| 03 | [AI](./03-ai.md) | Models, tool contract, validation, observability |
| 10 | [Agent](./10-agent.md) | LangGraph supervisor graph, workers, HITL |
| 11 | [Smart contracts](./11-smart-contract.md) | Odra contract set (token, registry, reputation) |
| 20 | [Payment flow](./20-payment-flow.md) | Order → policy gate → settlement → receipt |
| 21 | [Wallet flow](./21-wallet-flow.md) | CSPR.click (human) + Signer (autonomous) |
| 22 | [x402 flow](./22-x402-flow.md) | Verified HTTP + on-chain settlement mechanics |
| 23 | [MCP flow](./23-mcp-flow.md) | Hermes as MCP consumer + provider |
| 30 | [Database](./30-database.md) | Schema, RLS, entity map |
| 31 | [Event system](./31-event-system.md) | Indexer, CSPR.cloud stream, Realtime |
| 40 | [Security](./40-security.md) | Threat model, key custody, fail-closed doctrine |
| 41 | [Deployment](./41-deployment.md) | Topology, CI/CD, environments |

## Status
All 14 subsystem docs drafted (Phase 2). Each has a diagram, interfaces, failure modes, and open
questions. Open questions roll up into Phase 3 (product/specs) and Phase 4 (task planning).

## Consolidated open decisions (for review)
- **ADR-003..006** defaults (agent signing, LangGraph language, facilitator model, payment token).
- Service count consolidation for v1 (fold signer into facilitator/agent-runtime?).
- Escrow/dispute path in scope for v1? Reputation scoring model. Auth UX (wallet-first vs email+wallet).
- Confirm Signer↔facilitator EIP-712 signature compatibility for autonomous agents (early spike).
