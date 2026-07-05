# PRD: Hermes — Commerce Layer for Autonomous AI Agents

> Owner: product · Status: Draft (Phase 3) · Updated: 2026-07-05 · Vocabulary: `.claude/context/glossary.md`

## 1. Problem
Autonomous AI agents can plan and act, but they cannot **transact** with each other in a trustworthy,
accountable way. There is no shared layer where an agent can *find* another agent's service, *agree* on
terms, *pay* for it, and have that payment *settle* with a durable, auditable record — under spend
controls a human or organization can trust. Today this is bespoke, insecure, and unverifiable.

## 2. Solution
Hermes is a commerce layer on **Casper** where agents **discover → negotiate → purchase → execute →
pay → settle → build reputation**, with payments settled via **x402** (CEP-18, `transfer_with_authorization`)
and every spend gated by an explicit policy (budget, allowlist, human-in-the-loop above threshold). The
chain is the trust root; Supabase mirrors it for a real-time operator experience.

## 3. Users & personas
- **Operator (human)** — runs/oversees one or more Agents; sets budgets/policies, approves large spends
  (HITL), watches workflows and receipts. Primary UI user.
- **Seller Agent** — publishes **Listings** (capabilities + price + terms), fulfills **Orders**.
- **Buyer Agent** — discovers Listings, negotiates **Offers**, places **Orders**, pays autonomously.
- **External Agent (3rd-party)** — connects via the **Hermes MCP server** to buy or sell.
- **Developer** — integrates an agent/service using the SDK + MCP tools + x402.

## 4. Goals / Non-goals
**Goals (v1)**
- End-to-end path: discover → negotiate → order → x402 pay → on-chain settle → receipt → reputation.
- Policy-gated autonomous spend with HITL approvals; full spend auditability.
- Real-time operator console + workflow canvas visualizing agent runs.
- MCP surface so external agents can transact; own CEP-18 token on testnet.

**Non-goals (v1)**
- Mainnet launch (testnet for the buildathon; mainnet post-audit).
- Streaming/metered/subscription payments (x402 `exact` is fixed-amount).
- Fiat on/off-ramp; cross-chain settlement; complex dispute arbitration (basic reputation only).

## 5. User stories (selected)
- *As an Operator*, I set a per-agent daily budget and an auto-approve threshold, so my agent can pay
  small amounts autonomously but escalates large ones to me.
- *As a Buyer Agent*, I discover agents by capability + reputation, negotiate a price within my budget,
  and pay on `402` without a human in the loop (under threshold).
- *As a Seller Agent*, I publish a Listing and receive settled payment with a Receipt before/at delivery.
- *As an Operator*, I watch a live workflow canvas and see each Task, payment, and settlement update in
  real time, and I can approve a pending high-value spend from the Approvals view.
- *As an External Agent*, I call `agent_discover` and `payment_pay` over MCP and get a Receipt back.

## 6. Functional requirements
1. **Registry & discovery** — register Agents (Casper account + capabilities); browse/search Listings by
   capability, price, reputation.
2. **Negotiation** — bounded Offer exchange (propose/counter/accept/reject) with guardrails.
3. **Orders** — accepted Offer → Order with price/asset/terms and a lifecycle.
4. **Payments (x402)** — 402 challenge → policy gate → sign authorization → facilitator verify+settle →
   Receipt. Idempotent (nonce), exactly-once, fail-closed.
5. **Policy & HITL** — budget + allowlist + threshold; interrupt for human approval; every spend logged.
6. **Reputation** — accrue reputation from completed/failed Orders; anchor on-chain; show in marketplace.
7. **Workflows** — multi-step, multi-agent execution visualized on the canvas.
8. **MCP surface** — tools/resources/prompts for external agents.
9. **Observability** — per-run trace (nodes, tools, tokens, cost) + spend audit trail.

## 7. UX flows (see UI spec)
Onboarding/connect wallet → create Agent → fund → publish Listing / set policy → run buyer intent →
(HITL approval) → watch workflow → view Order/Receipt → reputation updates.

## 8. Success metrics
- **Activation:** operator creates an Agent + completes one settled Order (testnet).
- **Autonomy:** % of Orders paid without HITL (within policy) vs escalated.
- **Integrity:** 100% of settled Payments have a matching on-chain deploy + Receipt (zero divergence).
- **Latency:** discover→settled median time; settlement confirmation time.
- **Trust:** zero unauthorized spends (all spends policy-gated + audited).

## 9. Dependencies & risks
- **x402/facilitator** availability (settlement SPOF) — ADR-005. **Agent signing** security — ADR-003.
- `casper-js-sdk` v5 signature compatibility with the facilitator's EIP-712 verification (early spike).
- LangGraph runtime maturity (Python service, ADR-004). CSPR.cloud event coverage for our contracts.

## 10. Rollout (phased — see roadmap)
M1 foundations → M2 contracts+x402 → M3 agent runtime+policy → M4 web console+canvas → M5 MCP+reputation
→ M6 hardening+demo. Testnet throughout.

## 11. Open questions
Escrow/dispute in v1? Reputation scoring model? Auth UX (wallet-first vs email+wallet)? Which capabilities
are paywalled? (tracked in the architecture index + ADRs).
